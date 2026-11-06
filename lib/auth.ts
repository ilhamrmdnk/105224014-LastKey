import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export type UserRole = "OWNER" | "RECIPIENT";

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "lastkey_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 jam
const BCRYPT_SALT_ROUNDS = 12;

// Penyimpanan token sesi khusus untuk eksekusi Node.js test runner di luar konteks HTTP Next.js
let activeTestSessionToken: string | null = null;
let isTestModeActive = false;

function getSessionSecret(): string {
  const secret = process.env.LASTKEY_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "LASTKEY_SESSION_SECRET environment variable must be configured with at least 32 characters (fail-closed)."
    );
  }
  return secret;
}

/**
 * Hash password menggunakan bcrypt dengan cost factor 12 (Mitigasi R01).
 * Password plaintext tidak pernah disimpan ke database.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Password harus memiliki minimal 8 karakter.");
  }
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifikasi password plaintext terhadap bcrypt hash secara constant-time (Mitigasi R01).
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Membuat signed session token berbasis HMAC-SHA256.
 */
export function createSessionToken(user: {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}): string {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionUser = {
    userId: user.userId,
    name: user.name,
    email: user.email.toLowerCase(),
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Memverifikasi integritas HMAC-SHA256 dan masa berlaku session token.
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const secret = getSessionSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const decodedJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(decodedJson) as Partial<SessionUser>;

    const now = Math.floor(Date.now() / 1000);
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      (parsed.role !== "OWNER" && parsed.role !== "RECIPIENT") ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= now
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      iat: typeof parsed.iat === "number" ? parsed.iat : now,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Digunakan oleh automated test runner untuk menyetel token sesi yang ditandatangani
 * ketika berada di luar konteks request HTTP Next.js.
 */
export function setTestSessionToken(token: string | null): void {
  isTestModeActive = true;
  activeTestSessionToken = token;
}

export function clearTestSessionMode(): void {
  isTestModeActive = false;
  activeTestSessionToken = null;
}

/**
 * Membaca sesi pengguna saat ini dari cookie HTTP-only (atau token test saat pengujian CLI).
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  if (isTestModeActive) {
    if (!activeTestSessionToken) return null;
    return verifySessionToken(activeTestSessionToken);
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Menyimpan session cookie dengan atribut keamanan:
 * httpOnly: true, sameSite: "lax", secure: production, path: "/"
 */
export async function setSessionCookie(token: string): Promise<void> {
  if (isTestModeActive) {
    activeTestSessionToken = token;
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  if (isTestModeActive) {
    activeTestSessionToken = null;
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

