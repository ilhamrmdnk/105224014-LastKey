import "dotenv/config";
import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { prisma } from "../lib/prisma";
import {
  createSessionToken,
  setTestSessionToken,
  clearTestSessionMode,
} from "../lib/auth";
import {
  createVaultAction,
  getVaultsFromDb,
  getVaultByIdFromDb,
  updateVaultAction,
  deleteVaultAction,
} from "../lib/actions/vault-actions";
import {
  createRecipientAction,
  getRecipientsFromDb,
  getRecipientByIdFromDb,
  updateRecipientAction,
  deleteRecipientAction,
} from "../lib/actions/recipient-actions";
import { isEncryptedPayload, decryptVaultField } from "../crypto/aes-gcm";

let createdRecipientId = "";
let createdVaultId = "";

before(async () => {
  // Set sesi sebagai Primary OWNER (owner@example.test)
  const owner = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
  });
  assert.ok(owner, "Seed user owner@example.test harus tersedia di PostgreSQL");

  const token = createSessionToken({
    userId: owner.id,
    name: owner.name,
    email: owner.email,
    role: "OWNER",
  });
  setTestSessionToken(token);

  // Bersihkan sisa data test sebelumnya jika ada
  await prisma.vault.deleteMany({
    where: { name: { startsWith: "[TEST-V02]" } },
  });
  await prisma.recipient.deleteMany({
    where: { email: "nadia.vega@example.test" },
  });
});

after(async () => {
  clearTestSessionMode();
  await prisma.$disconnect();
});

test("TC-01 (Create Recipient): berhasil membuat Recipient sintetis baru di PostgreSQL", async () => {
  const result = await createRecipientAction({
    name: "Nadia Vega",
    role: "Security Auditor",
    email: "nadia.vega@example.test",
  });

  assert.equal(result.success, true, result.error);
  assert.ok(result.recipient);
  assert.equal(result.recipient.name, "Nadia Vega");
  assert.equal(result.recipient.email, "nadia.vega@example.test");

  createdRecipientId = result.recipient.id;

  const dbRow = await prisma.recipient.findUnique({
    where: { id: createdRecipientId },
  });
  assert.ok(dbRow);
  assert.equal(dbRow.email, "nadia.vega@example.test");
});

test("TC-02 (Read Recipient): berhasil membaca daftar dan detail Recipient dari PostgreSQL", async () => {
  const list = await getRecipientsFromDb();
  assert.ok(list.length >= 5);
  const found = list.find((r) => r.id === createdRecipientId);
  assert.ok(found);

  const detail = await getRecipientByIdFromDb(createdRecipientId);
  assert.ok(detail);
  assert.equal(detail.name, "Nadia Vega");
  assert.equal(detail.role, "Security Auditor");
});

test("TC-03 (Update Recipient): berhasil memperbarui data Recipient di PostgreSQL", async () => {
  const result = await updateRecipientAction(createdRecipientId, {
    name: "Nadia Vega, CISA",
    role: "Lead Cryptographic Auditor",
    email: "nadia.vega@example.test",
  });

  assert.equal(result.success, true, result.error);
  assert.ok(result.recipient);
  assert.equal(result.recipient.name, "Nadia Vega, CISA");
  assert.equal(result.recipient.role, "Lead Cryptographic Auditor");

  const dbRow = await prisma.recipient.findUnique({
    where: { id: createdRecipientId },
  });
  assert.equal(dbRow?.name, "Nadia Vega, CISA");
});

test("TC-04 (Create Vault + AES-256-GCM DB Encryption): berhasil membuat Vault dan mengenkripsi description di PostgreSQL", async () => {
  const result = await createVaultAction({
    name: "[TEST-V02] Audit Keys Compartment",
    description: "Synthetic secret recovery instructions for v0.2 integration test",
    recipient: createdRecipientId,
    checkInInterval: "14 days",
    gracePeriod: "48 hours",
    confirmation: true,
  });

  assert.equal(result.success, true, result.error);
  assert.ok(result.vault);
  createdVaultId = result.vault.id;

  // UI/Action mengembalikan plaintext yang telah didekripsi
  assert.equal(
    result.vault.description,
    "Synthetic secret recovery instructions for v0.2 integration test"
  );
  assert.equal(result.vault.recipient?.id, createdRecipientId);

  // Bukti di PostgreSQL: kolom description tersimpan sebagai ciphertext enc:v1:... (BUKAN plaintext)
  const rawDbVault = await prisma.vault.findUnique({
    where: { id: createdVaultId },
  });
  assert.ok(rawDbVault?.description);
  assert.equal(isEncryptedPayload(rawDbVault.description), true);
  assert.notEqual(
    rawDbVault.description,
    "Synthetic secret recovery instructions for v0.2 integration test"
  );
  assert.equal(
    decryptVaultField(rawDbVault.description, createdVaultId, "description"),
    "Synthetic secret recovery instructions for v0.2 integration test"
  );
});

test("TC-05 (Read Vault): berhasil membaca daftar Vault dan detail Vault terdekripsi dari PostgreSQL", async () => {
  const vaults = await getVaultsFromDb();
  const inList = vaults.find((v) => v.id === createdVaultId);
  assert.ok(inList);
  assert.equal(inList.name, "[TEST-V02] Audit Keys Compartment");

  const detail = await getVaultByIdFromDb(createdVaultId);
  assert.ok(detail);
  assert.equal(
    detail.description,
    "Synthetic secret recovery instructions for v0.2 integration test"
  );
  assert.equal(detail.recipient?.email, "nadia.vega@example.test");
});

test("TC-06 (Update Vault): berhasil memperbarui Vault dan mengenkripsi ulang description dengan nonce baru", async () => {
  const beforeRow = await prisma.vault.findUnique({
    where: { id: createdVaultId },
  });

  const result = await updateVaultAction(createdVaultId, {
    name: "[TEST-V02] Audit Keys Compartment Updated",
    description: "Updated confidential payload with fresh AES-GCM nonce",
    status: "PENDING",
    recipientId: createdRecipientId,
    checkInInterval: "30 days",
    gracePeriod: "72 hours",
  });

  assert.equal(result.success, true, result.error);
  assert.ok(result.vault);
  assert.equal(result.vault.name, "[TEST-V02] Audit Keys Compartment Updated");
  assert.equal(result.vault.status, "PENDING");
  assert.equal(
    result.vault.description,
    "Updated confidential payload with fresh AES-GCM nonce"
  );

  const afterRow = await prisma.vault.findUnique({
    where: { id: createdVaultId },
  });
  assert.ok(afterRow?.description);
  assert.equal(isEncryptedPayload(afterRow.description), true);
  assert.notEqual(afterRow.description, beforeRow?.description);
});

test("TC-07 (Relasi Positif & Referential Integrity): Recipient terhubung dengan Vault dan menolak dihapus saat masih digunakan", async () => {
  const recDetail = await getRecipientByIdFromDb(createdRecipientId);
  assert.ok(recDetail);
  assert.equal(
    recDetail.vaults.some((v) => v.id === createdVaultId),
    true
  );

  // Mencoba menghapus Recipient yang masih digunakan oleh Vault aktif harus ditolak
  const deleteAttempt = await deleteRecipientAction(createdRecipientId);
  assert.equal(deleteAttempt.success, false);
  assert.match(deleteAttempt.error ?? "", /masih digunakan oleh Vault aktif/i);

  // Pastikan Vault dan Recipient masih utuh di database
  const vaultStillExists = await prisma.vault.findUnique({
    where: { id: createdVaultId },
  });
  assert.ok(vaultStillExists);
});

test("TC-08 (Delete Vault): berhasil menghapus Vault dari PostgreSQL", async () => {
  const res = await deleteVaultAction(createdVaultId);
  assert.equal(res.success, true, res.error);

  const checkDb = await prisma.vault.findUnique({
    where: { id: createdVaultId },
  });
  assert.equal(checkDb, null);
});

test("TC-09 (Delete Recipient): berhasil menghapus Recipient setelah tidak ada Vault yang bergantung", async () => {
  const res = await deleteRecipientAction(createdRecipientId);
  assert.equal(res.success, true, res.error);

  const checkDb = await prisma.recipient.findUnique({
    where: { id: createdRecipientId },
  });
  assert.equal(checkDb, null);
});

test("TC-10 (Relasi Negatif): menolak pembuatan Vault dengan Recipient yang tidak terdaftar di database", async () => {
  const countBefore = await prisma.vault.count();

  const res = await createVaultAction({
    name: "[TEST-V02] Invalid Relation Vault",
    description: "Should not be saved",
    recipient: "rec-does-not-exist-999",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
    confirmation: true,
  });

  assert.equal(res.success, false);
  assert.ok(res.fieldErrors?.recipient);

  const countAfter = await prisma.vault.count();
  assert.equal(countAfter, countBefore);
});

// ============================================================================
// Pengujian Penolakan Input Tidak Valid oleh Server Validation (Zod 4)
// ============================================================================

test("SV-01 (Server Validation — Nama Vault Terlalu Pendek): ditolak oleh Server Action", async () => {
  const countBefore = await prisma.vault.count();

  const res = await createVaultAction({
    name: "AB", // Kurang dari 3 karakter
    description: "Valid description",
    recipient: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
    confirmation: true,
  });

  assert.equal(res.success, false);
  assert.equal(res.fieldErrors?.name, "Vault Name minimal 3 karakter.");
  assert.equal(await prisma.vault.count(), countBefore);
});

test("SV-02 (Server Validation — Enum Interval & Confirmation Tidak Valid): ditolak oleh Server Action", async () => {
  const countBefore = await prisma.vault.count();

  const res = await createVaultAction({
    name: "Valid Vault Name",
    description: "Valid description",
    recipient: "rec-1",
    checkInInterval: "999 days", // Bukan enum yang diizinkan
    gracePeriod: "48 hours",
    confirmation: false, // Belum dikonfirmasi
  });

  assert.equal(res.success, false);
  assert.ok(res.fieldErrors?.checkInInterval);
  assert.ok(res.fieldErrors?.confirmation);
  assert.equal(await prisma.vault.count(), countBefore);
});

test("SV-03 (Server Validation — Aturan Semantik Timing 7 days + 72 hours): ditolak oleh refinement Zod 4", async () => {
  const countBefore = await prisma.vault.count();

  const res = await createVaultAction({
    name: "Weekly Vault With Excessive Grace",
    description: "Testing semantic refinement rule",
    recipient: "rec-1",
    checkInInterval: "7 days",
    gracePeriod: "72 hours", // Melanggar batas rasio <= 35% dari Check-in Interval
    confirmation: true,
  });

  assert.equal(res.success, false);
  assert.ok(res.fieldErrors?.gracePeriod);
  assert.match(res.fieldErrors.gracePeriod, /72 hours ditolak/i);
  assert.equal(await prisma.vault.count(), countBefore);
});

test("SV-04 (Server Validation — Format Email & Nama Recipient Tidak Valid): ditolak oleh recipientSchema", async () => {
  const countBefore = await prisma.recipient.count();

  const res = await createRecipientAction({
    name: "X",
    role: "Y",
    email: "invalid-email-format",
  });

  assert.equal(res.success, false);
  assert.ok(res.fieldErrors?.name);
  assert.ok(res.fieldErrors?.role);
  assert.ok(res.fieldErrors?.email);
  assert.equal(await prisma.recipient.count(), countBefore);
});

