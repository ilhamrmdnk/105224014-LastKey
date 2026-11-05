import { gcm } from "@noble/ciphers/aes.js";

export const KEY_LENGTH = 32; // 256-bit AES key
export const NONCE_LENGTH = 12; // 96-bit GCM standard nonce
export const TAG_LENGTH = 16; // 128-bit GCM authentication tag (appended to ciphertext by @noble/ciphers)
export const PAYLOAD_PREFIX = "enc:v1";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export interface EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  aad?: Uint8Array;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function validateKey(key: Uint8Array): void {
  if (!(key instanceof Uint8Array) || key.length !== KEY_LENGTH) {
    throw new Error(`AES-256 key must be a Uint8Array of exactly ${KEY_LENGTH} bytes`);
  }
}

function validateNonce(nonce: Uint8Array): void {
  if (!(nonce instanceof Uint8Array) || nonce.length !== NONCE_LENGTH) {
    throw new Error(`AES-GCM nonce must be a Uint8Array of exactly ${NONCE_LENGTH} bytes`);
  }
}

export function generateKey(): Uint8Array {
  return randomBytes(KEY_LENGTH);
}

/**
 * Membentuk Additional Authenticated Data (AAD) kontekstual untuk LastKey.
 * Mengikat ciphertext dengan versi format, ID vault, dan nama field sehingga
 * ciphertext tidak dapat dipindahkan antar-vault atau antar-konteks.
 */
export function buildVaultAAD(vaultId: string, field: string = "description"): Uint8Array {
  const normalizedVaultId = vaultId.trim();
  const normalizedField = field.trim();
  if (!normalizedVaultId || !normalizedField) {
    throw new Error("Vault ID and field name are required to construct AAD");
  }
  return textEncoder.encode(`lastkey:v1:vault:${normalizedVaultId}:${normalizedField}`);
}

export function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  aad?: Uint8Array
): EncryptedData {
  validateKey(key);
  if (!(plaintext instanceof Uint8Array)) {
    throw new Error("Plaintext must be a Uint8Array");
  }
  if (aad !== undefined && !(aad instanceof Uint8Array)) {
    throw new Error("AAD must be a Uint8Array when provided");
  }

  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = aad ? gcm(key, nonce, aad) : gcm(key, nonce);
  const ciphertext = cipher.encrypt(plaintext);

  return aad ? { ciphertext, nonce, aad } : { ciphertext, nonce };
}

export function decrypt(
  encryptedData: EncryptedData,
  key: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  validateKey(key);
  if (!encryptedData || typeof encryptedData !== "object") {
    throw new Error("EncryptedData object is required");
  }
  validateNonce(encryptedData.nonce);

  if (
    !(encryptedData.ciphertext instanceof Uint8Array) ||
    encryptedData.ciphertext.length < TAG_LENGTH
  ) {
    throw new Error(
      `Invalid ciphertext: must be a Uint8Array of at least ${TAG_LENGTH} bytes (GCM authentication tag)`
    );
  }

  const effectiveAad = aad !== undefined ? aad : encryptedData.aad;
  if (effectiveAad !== undefined && !(effectiveAad instanceof Uint8Array)) {
    throw new Error("AAD must be a Uint8Array when provided");
  }

  const cipher = effectiveAad
    ? gcm(key, encryptedData.nonce, effectiveAad)
    : gcm(key, encryptedData.nonce);

  return cipher.decrypt(encryptedData.ciphertext);
}

/**
 * Mengambil kunci enkripsi 32-byte dari environment variable server-only
 * LASTKEY_ENCRYPTION_KEY_BASE64. Gagal secara fail-closed jika tidak tersedia atau tidak valid.
 */
export function getServerEncryptionKey(): Uint8Array {
  const rawBase64 = process.env.LASTKEY_ENCRYPTION_KEY_BASE64?.trim();
  if (!rawBase64) {
    throw new Error(
      "LASTKEY_ENCRYPTION_KEY_BASE64 environment variable is missing. Cryptographic operation aborted (fail-closed)."
    );
  }
  if (!BASE64_REGEX.test(rawBase64)) {
    throw new Error("LASTKEY_ENCRYPTION_KEY_BASE64 is not valid Base64.");
  }

  const buffer = Buffer.from(rawBase64, "base64");
  if (buffer.length !== KEY_LENGTH) {
    throw new Error(
      `LASTKEY_ENCRYPTION_KEY_BASE64 must decode to exactly ${KEY_LENGTH} bytes, got ${buffer.length} bytes.`
    );
  }

  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

/**
 * Serialisasi hasil enkripsi menjadi string berformat:
 * enc:v1:<nonce_base64>:<ciphertext_base64>
 */
export function serializeEncryptedPayload(encryptedData: EncryptedData): string {
  validateNonce(encryptedData.nonce);
  if (
    !(encryptedData.ciphertext instanceof Uint8Array) ||
    encryptedData.ciphertext.length < TAG_LENGTH
  ) {
    throw new Error("Invalid ciphertext for serialization");
  }

  const nonceB64 = Buffer.from(encryptedData.nonce).toString("base64");
  const ciphertextB64 = Buffer.from(encryptedData.ciphertext).toString("base64");
  return `${PAYLOAD_PREFIX}:${nonceB64}:${ciphertextB64}`;
}

/**
 * Deserialisasi string payload terenkripsi enc:v1:<nonce_base64>:<ciphertext_base64>
 * menjadi objek EncryptedData dengan validasi ketat.
 */
export function deserializeEncryptedPayload(payload: string): EncryptedData {
  if (typeof payload !== "string" || !payload.startsWith(`${PAYLOAD_PREFIX}:`)) {
    throw new Error("Invalid encrypted payload format: missing enc:v1 prefix");
  }

  const parts = payload.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted payload structure: expected 4 segments");
  }

  const [, , nonceB64, ciphertextB64] = parts;
  if (!nonceB64 || !ciphertextB64 || !BASE64_REGEX.test(nonceB64) || !BASE64_REGEX.test(ciphertextB64)) {
    throw new Error("Invalid encrypted payload encoding: corrupted Base64 segment");
  }

  const nonceBuf = Buffer.from(nonceB64, "base64");
  const cipherBuf = Buffer.from(ciphertextB64, "base64");

  if (nonceBuf.length !== NONCE_LENGTH) {
    throw new Error(`Invalid nonce length in payload: expected ${NONCE_LENGTH} bytes`);
  }
  if (cipherBuf.length < TAG_LENGTH) {
    throw new Error(`Invalid ciphertext length in payload: minimum ${TAG_LENGTH} bytes required`);
  }

  return {
    nonce: new Uint8Array(nonceBuf.buffer, nonceBuf.byteOffset, nonceBuf.byteLength),
    ciphertext: new Uint8Array(cipherBuf.buffer, cipherBuf.byteOffset, cipherBuf.byteLength),
  };
}

export function isEncryptedPayload(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${PAYLOAD_PREFIX}:`);
}

/**
 * Mengenkripsi field teks sensitif pada Vault dengan AES-256-GCM dan AAD kontekstual.
 */
export function encryptVaultField(
  plaintext: string,
  vaultId: string,
  field: string = "description",
  customKey?: Uint8Array
): string {
  const key = customKey ?? getServerEncryptionKey();
  const aad = buildVaultAAD(vaultId, field);
  const encrypted = encrypt(textEncoder.encode(plaintext), key, aad);
  return serializeEncryptedPayload(encrypted);
}

/**
 * Mendekripsi field teks sensitif pada Vault dengan verifikasi tag GCM dan AAD.
 * Fail-closed: melempar error apabila kunci, nonce, tag, format, atau AAD tidak cocok.
 */
export function decryptVaultField(
  payload: string,
  vaultId: string,
  field: string = "description",
  customKey?: Uint8Array
): string {
  const key = customKey ?? getServerEncryptionKey();
  const aad = buildVaultAAD(vaultId, field);
  const encryptedData = deserializeEncryptedPayload(payload);
  const decryptedBytes = decrypt(encryptedData, key, aad);
  return textDecoder.decode(decryptedBytes);
}
