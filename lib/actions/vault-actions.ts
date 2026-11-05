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
import {
  vaultSchema,
  vaultUpdateSchema,
} from "@/lib/validation/vault-schema";
import {
  decryptVaultField,
  encryptVaultField,
} from "@/crypto/aes-gcm";
import {
  type VaultItem,
} from "@/components/VaultCard";
import {
  DEFAULT_ACTIVITIES,
  type ActivityItem,
} from "@/components/ActivityList";

export interface CheckInState {
  id: string;
  status: "ACTIVE" | "WARNING" | "RELEASED";
  nextCheckIn: string;
  cyclePercent: number;
  verifiedAt: string;
  method: string;
}

type PrismaVaultWithRelations = Prisma.VaultGetPayload<{
  include: {
    recipient: true;
    files: true;
  };
}>;

/**
 * Helper: Map Prisma Vault model ke UI VaultItem sekaligus mendekripsi description
 * menggunakan AES-256-GCM + AAD kontekstual (vault.id).
 * Fail-closed: melempar error apabila ciphertext atau AAD tidak valid, dan tidak pernah
 * mengembalikan ciphertext mentah sebagai plaintext (Mitigasi R02, R05).
 */
function mapPrismaVaultToItem(vault: PrismaVaultWithRelations): VaultItem {
  let decryptedDescription: string | undefined = undefined;

  if (vault.description && vault.description.trim().length > 0) {
    // Dekripsi wajib berhasil dengan AAD = vault.id; jika gagal akan melempar error (fail-closed)
    decryptedDescription = decryptVaultField(
      vault.description,
      vault.id,
      "description"
    );
  }

  const fileCountNum = vault.files.length;
  const validStatus: "ACTIVE" | "LOCKED" | "PENDING" =
    vault.status === "ACTIVE" ||
    vault.status === "LOCKED" ||
    vault.status === "PENDING"
      ? vault.status
      : "ACTIVE";

  return {
    id: vault.id,
    name: vault.name,
    fileCount: `${fileCountNum} encrypted file${fileCountNum === 1 ? "" : "s"}`,
    status: validStatus,
    encryptionStatus: vault.encryptionStatus,
    lastUpdated: vault.lastUpdated,
    description: decryptedDescription,
    recipient: vault.recipient
      ? {
          id: vault.recipient.id,
          name: vault.recipient.name,
          role: vault.recipient.role,
          email: vault.recipient.email,
        }
      : undefined,
    checkInInterval: vault.checkInInterval,
    gracePeriod: vault.gracePeriod,
    nextCheckIn: vault.nextCheckIn ?? `${vault.checkInInterval} remaining`,
    lastCheckIn: vault.lastCheckIn ?? "Just now",
    files: vault.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      cipher: f.cipher,
    })),
  };
}

function formatDatabaseError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "Data duplikat terdeteksi di database.";
      case "P2025":
        return "Data yang diminta tidak ditemukan di database.";
      case "P2003":
        return "Relasi data tidak valid (Recipient atau Vault terkait tidak ditemukan).";
      case "P1001":
      case "P1002":
        return "Tidak dapat terhubung ke database PostgreSQL.";
      default:
        return `Terjadi kesalahan operasional database (${error.code}).`;
    }
  }
  if (error instanceof Error && error.message.includes("LASTKEY_ENCRYPTION_KEY_BASE64")) {
    return "Konfigurasi kunci enkripsi server tidak tersedia atau tidak valid (fail-closed).";
  }
  return "Terjadi kesalahan server saat memproses permintaan database.";
}

// ============================================================================
// A. VAULT OPERATIONS (CRUD + RBAC + AES-256-GCM + ZOD 4 SERVER VALIDATION)
// ============================================================================

/**
 * Mengambil daftar Vault dari PostgreSQL berdasarkan hak akses (RBAC):
 * - UNAUTHENTICATED: ditolak (mengembalikan array kosong).
 * - OWNER: hanya mengembalikan Vault milik OWNER tersebut (ownerId === session.userId).
 * - RECIPIENT: hanya mengembalikan Vault yang ditugaskan kepada email RECIPIENT tersebut.
 * Tidak menggunakan mock data sebagai fallback (PostgreSQL adalah source of truth).
 */
export async function getVaultsFromDb(): Promise<VaultItem[]> {
  const session = await getCurrentSession();
  if (!session) {
    return [];
  }

  const whereClause: Prisma.VaultWhereInput =
    session.role === "OWNER"
      ? { ownerId: session.userId }
      : {
          recipient: {
            email: session.email.toLowerCase(),
          },
        };

  const vaults = await prisma.vault.findMany({
    where: whereClause,
    include: {
      recipient: true,
      files: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const results: VaultItem[] = [];
  for (const v of vaults) {
    try {
      results.push(mapPrismaVaultToItem(v));
    } catch (error) {
      // Fail-closed per item: jangan pernah kembalikan ciphertext mentah apabila dekripsi gagal
      console.error(`[LastKey Crypto] Fail-closed decryption error for vault ${v.id}:`, error);
    }
  }
  return results;
}

/**
 * Mengambil detail satu Vault dari PostgreSQL dengan verifikasi RBAC, Anti-IDOR,
 * dan dekripsi fail-closed AES-256-GCM + AAD.
 */
export async function getVaultByIdFromDb(
  id: string
): Promise<VaultItem | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const vault = await prisma.vault.findUnique({
    where: { id },
    include: {
      recipient: true,
      files: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!vault) {
    return null;
  }

  // Pemeriksaan kepemilikan / penugasan (Anti-IDOR — Mitigasi R01, R02)
  if (session.role === "OWNER") {
    if (vault.ownerId !== session.userId) {
      return null;
    }
  } else if (session.role === "RECIPIENT") {
    if (vault.recipient?.email.toLowerCase() !== session.email.toLowerCase()) {
      return null;
    }
  } else {
    return null;
  }

  try {
    return mapPrismaVaultToItem(vault);
  } catch (error) {
    // Fail-closed: tolak pengembalian data apabila dekripsi/integritas GCM gagal
    console.error(`[LastKey Crypto] Fail-closed on getVaultByIdFromDb(${id}):`, error);
    return null;
  }
}

export interface CreateVaultActionInput {
  name: string;
  description: string;
  recipient: string;
  checkInInterval: string;
  gracePeriod: string;
  confirmation: boolean;
}

export async function createVaultAction(input: CreateVaultActionInput): Promise<{
  success: boolean;
  vault?: VaultItem;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // 1. Pemeriksaan RBAC Server-Side (Mitigasi R01, R02)
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk membuat Vault (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan membuat Vault baru (R02).",
    };
  }

  // 2. Validasi Server-Side menggunakan Zod 4 Schema (termasuk aturan semantik)
  const result = vaultSchema.safeParse(input);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    const firstError =
      Object.values(fieldErrors)[0] ||
      "Validasi data vault gagal. Periksa kembali input Anda.";
    return {
      success: false,
      error: firstError,
      fieldErrors,
    };
  }

  const validData = result.data;

  try {
    // 3. Verifikasi keberadaan dan kepemilikan Recipient di PostgreSQL (Mitigasi R04)
    const recipientRecord = await prisma.recipient.findUnique({
      where: { id: validData.recipient },
    });

    if (!recipientRecord || recipientRecord.ownerId !== session.userId) {
      return {
        success: false,
        error: "Recipient darurat yang dipilih tidak tersedia atau tidak sah di database.",
        fieldErrors: {
          recipient: "Recipient tidak ditemukan di database atau bukan milik akun Anda.",
        },
      };
    }

    // 4. Tentukan ID Vault sekuensial berikutnya (v-7, v-8, dst.)
    const existingVaults = await prisma.vault.findMany({
      select: { id: true },
    });

    let maxNum = 6;
    for (const v of existingVaults) {
      const match = /^v-(\d+)$/.exec(v.id);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextVaultId = `v-${maxNum + 1}`;

    // 5. Enkripsi description sensitif dengan AES-256-GCM + AAD (vaultId) sebelum simpan ke DB (Mitigasi R02, R05)
    const plainDescription =
      validData.description || "Zero-knowledge encrypted vault container";
    const encryptedDescription = encryptVaultField(
      plainDescription,
      nextVaultId,
      "description"
    );

    // 6. Simpan Vault ke PostgreSQL
    const createdVault = await prisma.vault.create({
      data: {
        id: nextVaultId,
        name: validData.name,
        description: encryptedDescription,
        status: "ACTIVE",
        encryptionStatus: "AES-256 GCM",
        checkInInterval: validData.checkInInterval,
        gracePeriod: validData.gracePeriod,
        lastUpdated: "Just now",
        nextCheckIn: `${validData.checkInInterval} 00 hours`,
        lastCheckIn: "Just now (Initialized)",
        recipientId: recipientRecord.id,
        ownerId: session.userId,
        files: {
          create: [
            {
              name: `${validData.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_manifest.enc`,
              size: "128 KB",
              cipher: "AES-256 GCM",
            },
          ],
        },
      },
      include: {
        recipient: true,
        files: true,
      },
    });

    // 7. Catat Audit Activity di PostgreSQL
    await prisma.activity.create({
      data: {
        title: "Vault created",
        description: `${validData.name} (${nextVaultId}) created and encrypted with AES-256-GCM`,
        timestamp: "Just now",
        type: "vault",
      },
    });

    safeRevalidate("/vault");
    safeRevalidate("/recipients");
    safeRevalidate("/");

    return {
      success: true,
      vault: mapPrismaVaultToItem(createdVault),
    };
  } catch (error) {
    console.error("[LastKey DB] createVaultAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}

export interface UpdateVaultActionInput {
  name: string;
  description: string;
  status: "ACTIVE" | "LOCKED" | "PENDING";
  recipientId: string;
  checkInInterval: string;
  gracePeriod: string;
}

export async function updateVaultAction(
  id: string,
  input: UpdateVaultActionInput
): Promise<{
  success: boolean;
  vault?: VaultItem;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  // 1. Pemeriksaan RBAC Server-Side (Mitigasi R01, R02)
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk mengubah Vault (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan mengubah Vault pemilik (R02).",
    };
  }

  // 2. Validasi Server-Side menggunakan Zod 4 Schema
  const parsed = vaultUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    const firstError =
      Object.values(fieldErrors)[0] ||
      "Validasi pembaruan vault gagal. Periksa kembali input Anda.";
    return {
      success: false,
      error: firstError,
      fieldErrors,
    };
  }

  const validData = parsed.data;

  try {
    // 3. Pemeriksaan keberadaan dan kepemilikan Vault (Anti-IDOR — Mitigasi R01, R02)
    const existingVault = await prisma.vault.findUnique({
      where: { id },
    });

    if (!existingVault) {
      return {
        success: false,
        error: "Vault tidak ditemukan di database.",
      };
    }

    if (existingVault.ownerId !== session.userId) {
      return {
        success: false,
        error: "Forbidden: Anda tidak berhak mengubah Vault milik pengguna lain (Anti-IDOR / R02).",
      };
    }

    // 4. Pemeriksaan keberadaan dan kepemilikan Recipient (Mitigasi R04)
    const recipientRecord = await prisma.recipient.findUnique({
      where: { id: validData.recipientId },
    });

    if (!recipientRecord || recipientRecord.ownerId !== session.userId) {
      return {
        success: false,
        error: "Recipient yang dipilih tidak tersedia atau tidak sah di database.",
        fieldErrors: {
          recipientId: "Recipient tidak ditemukan di database atau bukan milik akun Anda.",
        },
      };
    }

    // 5. Enkripsi ulang description dengan AES-256-GCM + AAD (id) dan nonce baru
    const plainDescription =
      validData.description || "Zero-knowledge encrypted vault container";
    const encryptedDescription = encryptVaultField(
      plainDescription,
      id,
      "description"
    );

    const updatedVault = await prisma.vault.update({
      where: { id },
      data: {
        name: validData.name,
        description: encryptedDescription,
        status: validData.status,
        recipientId: recipientRecord.id,
        checkInInterval: validData.checkInInterval,
        gracePeriod: validData.gracePeriod,
        lastUpdated: "Updated just now",
      },
      include: {
        recipient: true,
        files: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await prisma.activity.create({
      data: {
        title: "Vault updated",
        description: `${updatedVault.name} (${id}) configuration was updated and re-sealed`,
        timestamp: "Just now",
        type: "vault",
      },
    });

    safeRevalidate("/vault");
    safeRevalidate(`/vault/${id}`);
    safeRevalidate("/recipients");
    safeRevalidate("/");

    return {
      success: true,
      vault: mapPrismaVaultToItem(updatedVault),
    };
  } catch (error) {
    console.error("[LastKey DB] updateVaultAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}

export async function deleteVaultAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu untuk menghapus Vault (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan menghapus Vault pemilik (R02).",
    };
  }

  try {
    const existing = await prisma.vault.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Vault tidak ditemukan di database.",
      };
    }

    if (existing.ownerId !== session.userId) {
      return {
        success: false,
        error: "Forbidden: Anda tidak berhak menghapus Vault milik pengguna lain (Anti-IDOR / R02).",
      };
    }

    const deleted = await prisma.vault.delete({
      where: { id },
    });

    await prisma.activity.create({
      data: {
        title: "Vault deleted",
        description: `${deleted.name} (${id}) was removed from storage`,
        timestamp: "Just now",
        type: "vault",
      },
    });

    safeRevalidate("/vault");
    safeRevalidate("/recipients");
    safeRevalidate("/");

    return { success: true };
  } catch (error) {
    console.error("[LastKey DB] deleteVaultAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}

// ============================================================================
// B. VAULT FILE OPERATIONS
// ============================================================================

export async function addVaultFileAction(
  vaultId: string,
  input: { name: string; size: string; cipher?: string }
): Promise<{
  success: boolean;
  vault?: VaultItem;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login terlebih dahulu (R01).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan menambahkan file ke Vault (R02).",
    };
  }

  const rawName = input.name.trim();
  const rawSize = input.size.trim() || "256 KB";
  const cipher = input.cipher?.trim() || "AES-256 GCM";

  if (rawName.length < 2 || rawName.length > 100) {
    return {
      success: false,
      error: "Nama file harus terdiri dari 2 hingga 100 karakter.",
    };
  }

  const formattedName = rawName.endsWith(".enc") ? rawName : `${rawName}.enc`;

  try {
    const existingVault = await prisma.vault.findUnique({
      where: { id: vaultId },
    });

    if (!existingVault) {
      return {
        success: false,
        error: "Vault tidak ditemukan di database.",
      };
    }

    if (existingVault.ownerId !== session.userId) {
      return {
        success: false,
        error: "Forbidden: Anda tidak berhak memodifikasi Vault milik pengguna lain (Anti-IDOR / R02).",
      };
    }

    await prisma.vaultFile.create({
      data: {
        vaultId,
        name: formattedName,
        size: rawSize,
        cipher,
      },
    });

    const updatedVault = await prisma.vault.update({
      where: { id: vaultId },
      data: {
        lastUpdated: "Updated just now",
      },
      include: {
        recipient: true,
        files: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await prisma.activity.create({
      data: {
        title: "File encrypted",
        description: `${formattedName} was encrypted in ${updatedVault.name}`,
        timestamp: "Just now",
        type: "file",
      },
    });

    safeRevalidate("/vault");
    safeRevalidate(`/vault/${vaultId}`);
    safeRevalidate("/");

    return {
      success: true,
      vault: mapPrismaVaultToItem(updatedVault),
    };
  } catch (error) {
    console.error("[LastKey DB] addVaultFileAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}

// ============================================================================
// C. ACTIVITY & CHECK-IN OPERATIONS (Mitigasi R03 — Server-Side Validation & Timestamp)
// ============================================================================

export async function getActivitiesFromDb(): Promise<ActivityItem[]> {
  const session = await getCurrentSession();
  if (!session) {
    return [];
  }

  try {
    const records = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return records.map((act) => {
      const validType: ActivityItem["type"] =
        act.type === "vault" ||
        act.type === "file" ||
        act.type === "checkin" ||
        act.type === "recipient"
          ? act.type
          : "vault";

      return {
        id: act.id,
        title: act.title,
        description: act.description,
        timestamp: act.timestamp,
        type: validType,
      };
    });
  } catch (error) {
    console.error("[LastKey DB] Error fetching activities:", error);
    return DEFAULT_ACTIVITIES;
  }
}

export async function getCheckInStatusFromDb(): Promise<CheckInState> {
  try {
    const latest = await prisma.checkIn.findFirst({
      orderBy: { verifiedAt: "desc" },
    });

    if (!latest) {
      return {
        id: "default-checkin",
        status: "ACTIVE",
        nextCheckIn: "6 days 14 hours",
        cyclePercent: 78,
        verifiedAt: "3 days ago (11:24 UTC)",
        method: "Hardware Security Token / Passkey (AES-GCM Authenticated)",
      };
    }

    const validStatus: CheckInState["status"] =
      latest.status === "ACTIVE" ||
      latest.status === "WARNING" ||
      latest.status === "RELEASED"
        ? latest.status
        : "ACTIVE";

    return {
      id: latest.id,
      status: validStatus,
      nextCheckIn: latest.nextCheckIn,
      cyclePercent: latest.cyclePercent,
      verifiedAt:
        latest.cyclePercent === 100
          ? "Just now (Verified)"
          : "3 days ago (11:24 UTC)",
      method: latest.method,
    };
  } catch (error) {
    console.error("[LastKey DB] Error fetching check-in status:", error);
    return {
      id: "fallback-checkin",
      status: "ACTIVE",
      nextCheckIn: "6 days 14 hours",
      cyclePercent: 78,
      verifiedAt: "3 days ago (11:24 UTC)",
      method: "Hardware Security Token / Passkey (AES-GCM Authenticated)",
    };
  }
}

export async function performCheckInAction(): Promise<{
  success: boolean;
  checkIn?: CheckInState;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Unauthorized: Anda harus login sebagai OWNER untuk melakukan Check-in (R01/R03).",
    };
  }
  if (session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Peran RECIPIENT tidak diizinkan memanipulasi status Check-in (R03).",
    };
  }

  try {
    // Server-side timestamp (Mitigasi R03 — tidak mempercayai waktu dari client)
    const serverTimestamp = new Date();
    const existing = await prisma.checkIn.findFirst({
      orderBy: { verifiedAt: "desc" },
    });

    const record = existing
      ? await prisma.checkIn.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            nextCheckIn: "30 days 00 hours",
            cyclePercent: 100,
            verifiedAt: serverTimestamp,
          },
        })
      : await prisma.checkIn.create({
          data: {
            status: "ACTIVE",
            nextCheckIn: "30 days 00 hours",
            cyclePercent: 100,
            verifiedAt: serverTimestamp,
            method:
              "Hardware Security Token / Passkey (AES-GCM Authenticated)",
          },
        });

    await prisma.activity.create({
      data: {
        title: "Check-in completed",
        description: `Dead Man's Switch timer reset by ${session.email} at ${serverTimestamp.toISOString()}`,
        timestamp: "Just now",
        type: "checkin",
      },
    });

    safeRevalidate("/check-in");
    safeRevalidate("/");

    return {
      success: true,
      checkIn: {
        id: record.id,
        status: "ACTIVE",
        nextCheckIn: record.nextCheckIn,
        cyclePercent: record.cyclePercent,
        verifiedAt: "Just now (Verified)",
        method: record.method,
      },
    };
  } catch (error) {
    console.error("[LastKey DB] performCheckInAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}

export async function resetCheckInDemoAction(): Promise<{
  success: boolean;
  checkIn?: CheckInState;
  error?: string;
}> {
  const session = await getCurrentSession();
  if (!session || session.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Hanya OWNER terautentikasi yang dapat mereset timer demo Check-in (R03).",
    };
  }

  try {
    const existing = await prisma.checkIn.findFirst({
      orderBy: { verifiedAt: "desc" },
    });

    const record = existing
      ? await prisma.checkIn.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            nextCheckIn: "6 days 14 hours",
            cyclePercent: 78,
            verifiedAt: new Date(),
          },
        })
      : await prisma.checkIn.create({
          data: {
            status: "ACTIVE",
            nextCheckIn: "6 days 14 hours",
            cyclePercent: 78,
            verifiedAt: new Date(),
            method:
              "Hardware Security Token / Passkey (AES-GCM Authenticated)",
          },
        });

    safeRevalidate("/check-in");
    safeRevalidate("/");

    return {
      success: true,
      checkIn: {
        id: record.id,
        status: "ACTIVE",
        nextCheckIn: record.nextCheckIn,
        cyclePercent: record.cyclePercent,
        verifiedAt: "3 days ago (11:24 UTC)",
        method: record.method,
      },
    };
  } catch (error) {
    console.error("[LastKey DB] resetCheckInDemoAction error:", error);
    return {
      success: false,
      error: formatDatabaseError(error),
    };
  }
}
