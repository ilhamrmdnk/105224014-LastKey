"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Abaikan ketika dijalankan di dalam CLI test runner di luar request HTTP Next.js
  }
}
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { recipientSchema } from "@/lib/validation/recipient-schema";
import type { MockRecipient } from "@/components/VaultCard";

export interface RecipientWithVaults extends MockRecipient {
  ownerId?: string | null;
  vaults: {
    id: string;
    name: string;
    status: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

function formatRecipientDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "Email recipient sudah terdaftar. Gunakan alamat email yang berbeda.";
      case "P2003":
        return "Tidak dapat menghapus Recipient karena masih terhubung dengan Vault aktif.";
      case "P2025":
        return "Data recipient tidak ditemukan di database.";
      default:
        return `Terjadi kesalahan operasional database (${error.code}).`;
    }
  }
  return "Terjadi kesalahan server saat memproses data recipient.";
}

/**
 * Mengambil seluruh Recipient milik OWNER yang sedang login dari PostgreSQL.
 * Tidak menggunakan mock data sebagai fallback (PostgreSQL adalah source of truth).
 */
export async function getRecipientsFromDb(): Promise<RecipientWithVaults[]> {
  const session = await getCurrentSession();
  if (!session || session.role !== "OWNER") {
    return [];
  }

  const recipients = await prisma.recipient.findMany({
    where: { ownerId: session.userId },
    include: {
      vaults: {
        select: {
          id: true,
          name: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return recipients.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    email: r.email,
    ownerId: r.ownerId,
    vaults: r.vaults,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * Mengambil detail satu Recipient berdasarkan ID dengan pemeriksaan kepemilikan (Anti-IDOR).
 */
export async function getRecipientByIdFromDb(
  id: string
): Promise<RecipientWithVaults | null> {
  const session = await getCurrentSession();
  if (!session || session.role !== "OWNER") {
    return null;
  }

  const recipient = await prisma.recipient.findUnique({
    where: { id },
    include: {
      vaults: {
        select: {
          id: true,
          name: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!recipient || recipient.ownerId !== session.userId) {
    return null;
  }

  return {
    id: recipient.id,
    name: recipient.name,
    role: recipient.role,
    email: recipient.email,
    ownerId: recipient.ownerId,
    vaults: recipient.vaults,
    createdAt: recipient.createdAt.toISOString(),
    updatedAt: recipient.updatedAt.toISOString(),
  };
}

/**
 * Membuat Recipient baru dengan validasi server Zod 4 dan pemeriksaan RBAC (Mitigasi R01, R04).
 */
export async function createRecipientAction(input: {
  name: string;
  role: string;
  email: string;
}): Promise<{
  success: boolean;
  recipient?: RecipientWithVaults;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk menambahkan Recipient (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan menambahkan Recipient (R04).",
    };
  }

  const parsed = recipientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    const firstMessage =
      Object.values(fieldErrors)[0] ||
      "Validasi data recipient gagal. Periksa kembali input Anda.";
    return {
      success: false,
      error: firstMessage,
      fieldErrors,
    };
  }

  const validData = parsed.data;

  try {
    const duplicate = await prisma.recipient.findUnique({
      where: { email: validData.email },
    });
    if (duplicate) {
      return {
        success: false,
        error: "Email recipient sudah terdaftar. Gunakan alamat email yang berbeda.",
        fieldErrors: {
          email: "Alamat email ini sudah digunakan oleh recipient lain.",
        },
      };
    }

    const created = await prisma.recipient.create({
      data: {
        name: validData.name,
        role: validData.role,
        email: validData.email,
        ownerId: session.userId,
      },
      include: {
        vaults: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    await prisma.activity.create({
      data: {
        title: "Recipient created",
        description: `Trusted recipient ${created.name} (${created.email}) registered by ${session.email}`,
        timestamp: "Just now",
        type: "recipient",
      },
    });

    safeRevalidate("/recipients");
    safeRevalidate("/vault");
    safeRevalidate("/");

    return {
      success: true,
      recipient: {
        id: created.id,
        name: created.name,
        role: created.role,
        email: created.email,
        ownerId: created.ownerId,
        vaults: created.vaults,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[LastKey DB] createRecipientAction error:", error);
    return {
      success: false,
      error: formatRecipientDbError(error),
    };
  }
}

/**
 * Memperbarui data Recipient dengan validasi server Zod 4, pemeriksaan RBAC, dan Anti-IDOR (Mitigasi R01, R04).
 */
export async function updateRecipientAction(
  id: string,
  input: {
    name: string;
    role: string;
    email: string;
  }
): Promise<{
  success: boolean;
  recipient?: RecipientWithVaults;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk mengubah Recipient (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan mengubah data Recipient (R04).",
    };
  }

  const parsed = recipientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    const firstMessage =
      Object.values(fieldErrors)[0] ||
      "Validasi data recipient gagal. Periksa kembali input Anda.";
    return {
      success: false,
      error: firstMessage,
      fieldErrors,
    };
  }

  const validData = parsed.data;

  try {
    const existing = await prisma.recipient.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Recipient tidak ditemukan di database.",
      };
    }

    if (existing.ownerId !== session.userId) {
      return {
        success: false,
        error: "Forbidden: Anda tidak berhak mengubah Recipient milik pengguna lain (Anti-IDOR / R04).",
      };
    }

    if (validData.email !== existing.email) {
      const duplicate = await prisma.recipient.findUnique({
        where: { email: validData.email },
      });
      if (duplicate) {
        return {
          success: false,
          error: "Email recipient sudah terdaftar. Gunakan alamat email yang berbeda.",
          fieldErrors: {
            email: "Alamat email ini sudah digunakan oleh recipient lain.",
          },
        };
      }
    }

    const updated = await prisma.recipient.update({
      where: { id },
      data: {
        name: validData.name,
        role: validData.role,
        email: validData.email,
      },
      include: {
        vaults: {
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await prisma.activity.create({
      data: {
        title: "Recipient updated",
        description: `Trusted recipient ${updated.name} (${updated.email}) updated by ${session.email}`,
        timestamp: "Just now",
        type: "recipient",
      },
    });

    safeRevalidate("/recipients");
    safeRevalidate("/vault");
    safeRevalidate("/");

    return {
      success: true,
      recipient: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        ownerId: updated.ownerId,
        vaults: updated.vaults,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[LastKey DB] updateRecipientAction error:", error);
    return {
      success: false,
      error: formatRecipientDbError(error),
    };
  }
}

/**
 * Menghapus Recipient dengan pemeriksaan RBAC, Anti-IDOR, dan Referential Integrity
 * (Menolak penghapusan apabila Recipient masih digunakan oleh Vault aktif).
 */
export async function deleteRecipientAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk menghapus Recipient (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan menghapus Recipient (R04).",
    };
  }

  try {
    const existing = await prisma.recipient.findUnique({
      where: { id },
      include: {
        vaults: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Recipient tidak ditemukan di database.",
      };
    }

    if (existing.ownerId !== session.userId) {
      return {
        success: false,
        error: "Forbidden: Anda tidak berhak menghapus Recipient milik pengguna lain (Anti-IDOR / R04).",
      };
    }

    if (existing.vaults.length > 0) {
      const vaultList = existing.vaults.map((v) => `${v.name} (${v.id})`).join(", ");
      return {
        success: false,
        error: `Tidak dapat menghapus Recipient karena masih digunakan oleh Vault aktif: ${vaultList}. Ubah penerima pada Vault tersebut terlebih dahulu.`,
      };
    }

    await prisma.recipient.delete({
      where: { id },
    });

    await prisma.activity.create({
      data: {
        title: "Recipient deleted",
        description: `Trusted recipient ${existing.name} (${existing.email}) was removed`,
        timestamp: "Just now",
        type: "recipient",
      },
    });

    safeRevalidate("/recipients");
    safeRevalidate("/vault");
    safeRevalidate("/");

    return { success: true };
  } catch (error) {
    console.error("[LastKey DB] deleteRecipientAction error:", error);
    return {
      success: false,
      error: formatRecipientDbError(error),
    };
  }
}
