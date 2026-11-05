import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildVaultAAD,
  decrypt,
  decryptVaultField,
  deserializeEncryptedPayload,
  encrypt,
  encryptVaultField,
  generateKey,
  NONCE_LENGTH,
  serializeEncryptedPayload,
} from "./aes-gcm";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// ============================================================================
// Skenario Dasar (Milestone 1 / v0.1 — Dipertahankan)
// ============================================================================

test("1. encrypt lalu decrypt menghasilkan plaintext asli", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("LastKey secure vault");

  const encrypted = encrypt(plaintext, key);
  const decrypted = decrypt(encrypted, key);

  assert.equal(textDecoder.decode(decrypted), "LastKey secure vault");
});

test("2. enkripsi plaintext yang sama menghasilkan nonce berbeda", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("LastKey secure vault");

  const encrypted1 = encrypt(plaintext, key);
  const encrypted2 = encrypt(plaintext, key);

  assert.equal(encrypted1.nonce.length, NONCE_LENGTH);
  assert.equal(encrypted2.nonce.length, NONCE_LENGTH);
  assert.notDeepEqual(encrypted1.nonce, encrypted2.nonce);
});

test("3. perubahan ciphertext menyebabkan dekripsi gagal", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("LastKey secure vault");

  const encrypted = encrypt(plaintext, key);

  encrypted.ciphertext[0] ^= 1;

  assert.throws(() => {
    decrypt(encrypted, key);
  });
});

test("4. key yang salah menyebabkan dekripsi gagal", () => {
  const key = generateKey();
  const wrongKey = generateKey();
  const plaintext = textEncoder.encode("LastKey secure vault");

  const encrypted = encrypt(plaintext, key);

  assert.throws(() => {
    decrypt(encrypted, wrongKey);
  });
});

// ============================================================================
// Skenario Tambahan (Milestone 2 / v0.2 — AAD, Key Length, Nonce, Payload)
// ============================================================================

test("5. encrypt dan decrypt dengan AAD yang konsisten berhasil mengembalikan plaintext", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("Master seed phrase shard #1");
  const aad = buildVaultAAD("v-1", "description");

  const encrypted = encrypt(plaintext, key, aad);
  const decrypted = decrypt(encrypted, key, aad);

  assert.equal(textDecoder.decode(decrypted), "Master seed phrase shard #1");
});

test("6. AAD yang salah atau berbeda konteks vault menyebabkan dekripsi gagal", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("Confidential legal escrow notes");
  const aadVault1 = buildVaultAAD("v-1", "description");
  const aadVault2 = buildVaultAAD("v-2", "description");

  const encrypted = encrypt(plaintext, key, aadVault1);

  assert.throws(() => {
    decrypt(encrypted, key, aadVault2);
  }, /ghash|tag|decrypt/i);
});

test("7. input key dengan panjang salah (bukan 32 byte) ditolak saat encrypt maupun decrypt", () => {
  const shortKey = new Uint8Array(16); // 128-bit, bukan 256-bit
  const longKey = new Uint8Array(64);
  const plaintext = textEncoder.encode("Sensitive vault data");

  assert.throws(() => {
    encrypt(plaintext, shortKey);
  }, /32 bytes/);

  assert.throws(() => {
    encrypt(plaintext, longKey);
  }, /32 bytes/);

  const validKey = generateKey();
  const encrypted = encrypt(plaintext, validKey);

  assert.throws(() => {
    decrypt(encrypted, shortKey);
  }, /32 bytes/);
});

test("8. nonce atau ciphertext yang tidak valid ditolak saat decrypt", () => {
  const key = generateKey();
  const plaintext = textEncoder.encode("Sensitive vault data");
  const encrypted = encrypt(plaintext, key);

  // Nonce dengan panjang salah (8 byte, bukan 12 byte)
  assert.throws(() => {
    decrypt(
      {
        nonce: new Uint8Array(8),
        ciphertext: encrypted.ciphertext,
      },
      key
    );
  }, /12 bytes/);

  // Ciphertext terlalu pendek (kurang dari 16 byte authentication tag)
  assert.throws(() => {
    decrypt(
      {
        nonce: encrypted.nonce,
        ciphertext: new Uint8Array(10),
      },
      key
    );
  }, /16 bytes/);
});

test("9. format encrypted payload yang tidak valid ditolak saat deserialisasi dan dekripsi", () => {
  const key = generateKey();

  // Prefix salah
  assert.throws(() => {
    deserializeEncryptedPayload("plain:v1:aaaa:bbbb");
  }, /missing enc:v1 prefix/);

  // Struktur segmen tidak lengkap
  assert.throws(() => {
    deserializeEncryptedPayload("enc:v1:only_one_segment");
  }, /expected 4 segments/);

  // Panjang nonce salah di dalam payload Base64
  const shortNonceB64 = Buffer.from(new Uint8Array(6)).toString("base64");
  const dummyCipherB64 = Buffer.from(new Uint8Array(24)).toString("base64");
  assert.throws(() => {
    deserializeEncryptedPayload(`enc:v1:${shortNonceB64}:${dummyCipherB64}`);
  }, /expected 12 bytes/);

  // Round-trip encryptVaultField & penolakan jika dipindah ke vaultId lain
  const payload = encryptVaultField("Private cold storage instructions", "v-4", "description", key);
  const decrypted = decryptVaultField(payload, "v-4", "description", key);
  assert.equal(decrypted, "Private cold storage instructions");

  assert.throws(() => {
    decryptVaultField(payload, "v-5", "description", key);
  });

  // Serialisasi dengan ciphertext rusak
  assert.throws(() => {
    serializeEncryptedPayload({
      nonce: new Uint8Array(12),
      ciphertext: new Uint8Array(4),
    });
  }, /Invalid ciphertext/);
});
