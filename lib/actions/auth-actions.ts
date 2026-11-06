"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Abaikan ketika dijalankan di dalam CLI test runner di luar request HTTP Next.js
  }
}
import {
  clearSessionCookie,
  createSessionToken,
  getCurrentSession,
  setSessionCookie,
  verifyPassword,
  type SessionUser,
  type UserRole,
} from "@/lib/auth";

export interface AuthActionResult {
  success: boolean;
  user?: SessionUser;
  error?: string;
}

/**
 * Mengambil informasi sesi pengguna saat ini dari server.
 */
export async function getSessionAction(): Promise<SessionUser | null> {
  return getCurrentSession();
}

/**
 * Login menggunakan email dan password dengan verifikasi bcrypt terhadap PostgreSQL (Mitigasi R01).
 */
export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "Kredensial tidak valid (email atau password salah).",
      };
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Kredensial tidak valid (email atau password salah).",
      };
    }

    const role: UserRole = user.role === "RECIPIENT" ? "RECIPIENT" : "OWNER";
    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
    });

    await setSessionCookie(token);

    await prisma.activity.create({
      data: {
        title: "Session authenticated",
        description: `${user.name} (${role}) signed in via verified bcrypt credentials`,
        timestamp: "Just now",
        type: "checkin",
      },
    });

    safeRevalidate("/");
    safeRevalidate("/vault");
    safeRevalidate("/recipients");
    safeRevalidate("/check-in");
    safeRevalidate("/login");

    const sessionUser = await getCurrentSession();
    return {
      success: true,
      user: sessionUser ?? undefined,
    };
  } catch (error) {
    console.error("[LastKey Auth] loginAction error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan pada server saat memverifikasi autentikasi.",
    };
  }
}

const ALLOWED_DEMO_EMAILS = new Set<string>([
  "owner@example.test",
  "owner2@example.test",
  "sarah.connor@example.test",
]);

/**
 * Helper khusus untuk simulasi pergantian akun uji sintetis (OWNER 1, OWNER 2, RECIPIENT)
 * hanya pada lingkungan development/test.
 * Ditolak secara tegas (fail-closed) apabila dipanggil pada NODE_ENV === "production" (Mitigasi R01).
 */
export async function switchDemoAccountAction(
  targetEmail: "owner@example.test" | "owner2@example.test" | "sarah.connor@example.test"
): Promise<AuthActionResult> {
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Forbidden: Fitur akun demo dinonaktifkan pada lingkungan produksi (R01).",
    };
  }

  const normalizedEmail =
    typeof targetEmail === "string" ? targetEmail.trim().toLowerCase() : "";
  if (!ALLOWED_DEMO_EMAILS.has(normalizedEmail)) {
    return {
      success: false,
      error: "Forbidden: Akun demo yang diminta tidak sah (R01).",
    };
  }

  const seedPassword = process.env.LASTKEY_SEED_PASSWORD?.trim();
  if (!seedPassword) {
    return {
      success: false,
      error: "Konfigurasi akun demo belum tersedia pada server pengembangan.",
    };
  }
  return loginAction({ email: normalizedEmail, password: seedPassword });
}

/**
 * Logout dan hapus session cookie HTTP-only.
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  await clearSessionCookie();
  revalidatePath("/");
  revalidatePath("/vault");
  revalidatePath("/recipients");
  revalidatePath("/check-in");
  revalidatePath("/login");
  return { success: true };
}
