import "dotenv/config";
import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { prisma } from "../lib/prisma";
import {
  createSessionToken,
  setTestSessionToken,
  clearTestSessionMode,
  verifyPassword,
} from "../lib/auth";
import { loginAction } from "../lib/actions/auth-actions";
import {
  createVaultAction,
  getVaultsFromDb,
  getVaultByIdFromDb,
  updateVaultAction,
  deleteVaultAction,
  performCheckInAction,
} from "../lib/actions/vault-actions";
import {
  createRecipientAction,
  getRecipientsFromDb,
  updateRecipientAction,
  deleteRecipientAction,
} from "../lib/actions/recipient-actions";

let owner1Token = "";
let owner2Token = "";
let recipientToken = "";
let tempVaultId = "";
let tempRecipientId = "";

before(async () => {
  const [owner1, owner2, recUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: "owner@example.test" } }),
    prisma.user.findUnique({ where: { email: "owner2@example.test" } }),
    prisma.user.findUnique({ where: { email: "sarah.connor@example.test" } }),
  ]);

  assert.ok(owner1 && owner2 && recUser, "Akun uji RBAC harus tersedia dari seed");

  owner1Token = createSessionToken({
    userId: owner1.id,
    name: owner1.name,
    email: owner1.email,
    role: "OWNER",
  });

  owner2Token = createSessionToken({
    userId: owner2.id,
    name: owner2.name,
    email: owner2.email,
    role: "OWNER",
  });

  recipientToken = createSessionToken({
    userId: recUser.id,
    name: recUser.name,
    email: recUser.email,
    role: "RECIPIENT",
  });
});

after(async () => {
  clearTestSessionMode();
  await prisma.$disconnect();
});

// ============================================================================
// A. Pengujian Password Hashing (Bcrypt — Mitigasi R01)
// ============================================================================

test("PH-01 (R01): Password di database disimpan sebagai hash bcrypt ($2b$12$...), bukan plaintext", async () => {
  const user = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
  });
  assert.ok(user);
  assert.match(user.passwordHash, /^\$2[aby]\$12\$/);
  const seedPassword = process.env.LASTKEY_SEED_PASSWORD ?? "";
  assert.notEqual(user.passwordHash, seedPassword);
});

test("PH-02 (R01): Verifikasi password yang benar berhasil melalui bcrypt.compare dan loginAction", async () => {
  const seedPassword = process.env.LASTKEY_SEED_PASSWORD ?? "";
  const user = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
  });
  assert.ok(user);

  const isMatch = await verifyPassword(seedPassword, user.passwordHash);
  assert.equal(isMatch, true);

  setTestSessionToken(null);
  const loginRes = await loginAction({
    email: "owner@example.test",
    password: seedPassword,
  });
  assert.equal(loginRes.success, true);
  assert.equal(loginRes.user?.email, "owner@example.test");
});

test("PH-03 (R01): Password yang salah ditolak oleh verifyPassword dan loginAction", async () => {
  const user = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
  });
  assert.ok(user);

  const isMatch = await verifyPassword("WrongPassword#999", user.passwordHash);
  assert.equal(isMatch, false);

  setTestSessionToken(null);
  const loginRes = await loginAction({
    email: "owner@example.test",
    password: "WrongPassword#999",
  });
  assert.equal(loginRes.success, false);
  assert.match(loginRes.error ?? "", /Kredensial tidak valid/i);
});

// ============================================================================
// B. 8 Pengujian Akses Positif (ALLOW — Sesuai Matriks Peran RBAC sec-0.2)
// ============================================================================

test("AC-POS-01 (ALLOW | OWNER | R01, R02): OWNER dapat membaca daftar Vault miliknya sendiri", async () => {
  setTestSessionToken(owner1Token);
  const vaults = await getVaultsFromDb();
  assert.ok(vaults.length >= 6);
  // Pastikan tidak membocorkan v-owner2 milik owner2
  assert.equal(
    vaults.some((v) => v.id === "v-owner2"),
    false
  );
});

test("AC-POS-02 (ALLOW | OWNER | R02): OWNER dapat membaca detail Vault miliknya sendiri (v-1)", async () => {
  setTestSessionToken(owner1Token);
  const vault = await getVaultByIdFromDb("v-1");
  assert.ok(vault);
  assert.equal(vault.id, "v-1");
  assert.equal(vault.name, "Important Documents");
});

test("AC-POS-03 (ALLOW | OWNER | R01, R02): OWNER dapat membuat dan menghapus Vault miliknya sendiri", async () => {
  setTestSessionToken(owner1Token);
  const createRes = await createVaultAction({
    name: "RBAC Positive Test Vault",
    description: "Created by authenticated OWNER",
    recipient: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
    confirmation: true,
  });
  assert.equal(createRes.success, true);
  assert.ok(createRes.vault);
  tempVaultId = createRes.vault.id;

  const delRes = await deleteVaultAction(tempVaultId);
  assert.equal(delRes.success, true);
});

test("AC-POS-04 (ALLOW | OWNER | R02): OWNER dapat memperbarui Vault miliknya sendiri (v-1)", async () => {
  setTestSessionToken(owner1Token);
  const updateRes = await updateVaultAction("v-1", {
    name: "Important Documents",
    description: "Legal papers, credentials, and identity certificates",
    status: "ACTIVE",
    recipientId: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
  });
  assert.equal(updateRes.success, true);
});

test("AC-POS-05 (ALLOW | OWNER | R04): OWNER dapat membaca daftar Recipient miliknya sendiri", async () => {
  setTestSessionToken(owner1Token);
  const recipients = await getRecipientsFromDb();
  assert.ok(recipients.length >= 4);
  assert.equal(
    recipients.some((r) => r.id === "rec-owner2"),
    false
  );
});

test("AC-POS-06 (ALLOW | OWNER | R04): OWNER dapat membuat, mengubah, dan menghapus Recipient miliknya sendiri", async () => {
  setTestSessionToken(owner1Token);
  const createRes = await createRecipientAction({
    name: "Budi Santoso",
    role: "Backup Trustee",
    email: "budi.santoso@example.test",
  });
  assert.equal(createRes.success, true);
  assert.ok(createRes.recipient);
  tempRecipientId = createRes.recipient.id;

  const updateRes = await updateRecipientAction(tempRecipientId, {
    name: "Budi Santoso, SH",
    role: "Senior Backup Trustee",
    email: "budi.santoso@example.test",
  });
  assert.equal(updateRes.success, true);

  const deleteRes = await deleteRecipientAction(tempRecipientId);
  assert.equal(deleteRes.success, true);
});

test("AC-POS-07 (ALLOW | OWNER | R03): OWNER dapat menjalankan Check-in Dead Man's Switch", async () => {
  setTestSessionToken(owner1Token);
  const checkInRes = await performCheckInAction();
  assert.equal(checkInRes.success, true);
  assert.equal(checkInRes.checkIn?.cyclePercent, 100);
});

test("AC-POS-08 (ALLOW | RECIPIENT | R02, R04): RECIPIENT dapat membaca Vault yang ditugaskan kepadanya (v-1)", async () => {
  setTestSessionToken(recipientToken);
  const assignedList = await getVaultsFromDb();
  assert.ok(assignedList.length >= 1);
  assert.equal(
    assignedList.every((v) => v.recipient?.email === "sarah.connor@example.test"),
    true
  );
  assert.equal(
    assignedList.some((v) => v.id === "v-1"),
    true
  );

  const assignedDetail = await getVaultByIdFromDb("v-1");
  assert.ok(assignedDetail);
  assert.equal(assignedDetail.id, "v-1");
});

// ============================================================================
// C. 8 Pengujian Akses Negatif (DENY — Unauthorized, Forbidden Role, & Anti-IDOR)
// ============================================================================

test("AC-NEG-01 (DENY | UNAUTHENTICATED | R01, R02): UNAUTHENTICATED ditolak saat membaca maupun membuat Vault", async () => {
  setTestSessionToken(null);

  const detail = await getVaultByIdFromDb("v-1");
  assert.equal(detail, null);

  const createRes = await createVaultAction({
    name: "Unauthorized Vault",
    description: "Should fail",
    recipient: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
    confirmation: true,
  });
  assert.equal(createRes.success, false);
  assert.match(createRes.error ?? "", /Unauthorized/i);
});

test("AC-NEG-02 (DENY | UNAUTHENTICATED | R01, R04): UNAUTHENTICATED ditolak saat membuat atau menghapus Recipient", async () => {
  setTestSessionToken(null);

  const createRes = await createRecipientAction({
    name: "Unauthorized Trustee",
    role: "Spoofed Role",
    email: "spoof@example.test",
  });
  assert.equal(createRes.success, false);
  assert.match(createRes.error ?? "", /Unauthorized/i);

  const delRes = await deleteRecipientAction("rec-1");
  assert.equal(delRes.success, false);
  assert.match(delRes.error ?? "", /Unauthorized/i);
});

test("AC-NEG-03 (DENY | UNAUTHENTICATED | R01, R03): UNAUTHENTICATED ditolak saat memicu Check-in", async () => {
  setTestSessionToken(null);

  const res = await performCheckInAction();
  assert.equal(res.success, false);
  assert.match(res.error ?? "", /Unauthorized/i);
});

test("AC-NEG-04 (DENY | RECIPIENT | R02): RECIPIENT ditolak saat membaca Vault yang tidak ditugaskan kepadanya (v-2)", async () => {
  setTestSessionToken(recipientToken);

  const unassignedDetail = await getVaultByIdFromDb("v-2");
  assert.equal(unassignedDetail, null);
});

test("AC-NEG-05 (DENY | RECIPIENT | R02): RECIPIENT ditolak saat mencoba mengubah atau menghapus Vault pemilik (v-1)", async () => {
  setTestSessionToken(recipientToken);

  const updateRes = await updateVaultAction("v-1", {
    name: "Tampered by Recipient",
    description: "Tampered",
    status: "ACTIVE",
    recipientId: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
  });
  assert.equal(updateRes.success, false);
  assert.match(updateRes.error ?? "", /Forbidden/i);

  const deleteRes = await deleteVaultAction("v-1");
  assert.equal(deleteRes.success, false);
  assert.match(deleteRes.error ?? "", /Forbidden/i);
});

test("AC-NEG-06 (DENY | RECIPIENT | R03, R04): RECIPIENT ditolak saat mencoba mengelola Recipient atau memanipulasi Check-in", async () => {
  setTestSessionToken(recipientToken);

  const recRes = await createRecipientAction({
    name: "Injected Recipient",
    role: "Attacker",
    email: "attacker@example.test",
  });
  assert.equal(recRes.success, false);
  assert.match(recRes.error ?? "", /Forbidden/i);

  const checkInRes = await performCheckInAction();
  assert.equal(checkInRes.success, false);
  assert.match(checkInRes.error ?? "", /Forbidden/i);
});

test("AC-NEG-07 (DENY | ANTI-IDOR VAULT | R01, R02): OWNER 1 ditolak saat membaca, mengubah, atau menghapus Vault milik OWNER 2 (v-owner2)", async () => {
  setTestSessionToken(owner1Token);

  const readOther = await getVaultByIdFromDb("v-owner2");
  assert.equal(readOther, null);

  const updateOther = await updateVaultAction("v-owner2", {
    name: "IDOR Overwrite Attempt",
    description: "IDOR attempt",
    status: "LOCKED",
    recipientId: "rec-1",
    checkInInterval: "30 days",
    gracePeriod: "48 hours",
  });
  assert.equal(updateOther.success, false);
  assert.match(updateOther.error ?? "", /Anti-IDOR|Forbidden/i);

  const deleteOther = await deleteVaultAction("v-owner2");
  assert.equal(deleteOther.success, false);
  assert.match(deleteOther.error ?? "", /Anti-IDOR|Forbidden/i);
});

test("AC-NEG-08 (DENY | ANTI-IDOR RECIPIENT | R01, R04): OWNER 1 ditolak saat mengubah atau menghapus Recipient milik OWNER 2 (rec-owner2)", async () => {
  setTestSessionToken(owner1Token);

  const updateOtherRec = await updateRecipientAction("rec-owner2", {
    name: "Hijacked Recipient",
    role: "Spoofed",
    email: "hijacked@example.test",
  });
  assert.equal(updateOtherRec.success, false);
  assert.match(updateOtherRec.error ?? "", /Anti-IDOR|Forbidden/i);

  const deleteOtherRec = await deleteRecipientAction("rec-owner2");
  assert.equal(deleteOtherRec.success, false);
  assert.match(deleteOtherRec.error ?? "", /Anti-IDOR|Forbidden/i);

  // OWNER 2 tetap dapat membaca Vault miliknya sendiri
  setTestSessionToken(owner2Token);
  const owner2Vault = await getVaultByIdFromDb("v-owner2");
  assert.ok(owner2Vault);
  assert.equal(owner2Vault.id, "v-owner2");
});
