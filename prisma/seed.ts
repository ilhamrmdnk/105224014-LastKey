import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth";
import { encryptVaultField, isEncryptedPayload } from "../crypto/aes-gcm";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting LastKey v0.2 idempotent database seeding...");

  // Ambil password uji sintetis dari environment variable (jangan simpan plaintext di Git)
  const seedPassword =
    process.env.LASTKEY_SEED_PASSWORD?.trim() ||
    `SyntheticSeed#${crypto.randomBytes(8).toString("hex")}`;

  const sharedPasswordHash = await hashPassword(seedPassword);

  // 1. Seed Akun Uji Sintetis (RBAC: OWNER utama, OWNER kedua untuk uji IDOR, dan RECIPIENT)
  const owner1 = await prisma.user.upsert({
    where: { email: "owner@example.test" },
    update: {
      name: "Ilham Ramadhan",
      role: "OWNER",
      passwordHash: sharedPasswordHash,
    },
    create: {
      id: "user-owner-1",
      name: "Ilham Ramadhan",
      email: "owner@example.test",
      role: "OWNER",
      passwordHash: sharedPasswordHash,
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "owner2@example.test" },
    update: {
      name: "Raka Pratama",
      role: "OWNER",
      passwordHash: sharedPasswordHash,
    },
    create: {
      id: "user-owner-2",
      name: "Raka Pratama",
      email: "owner2@example.test",
      role: "OWNER",
      passwordHash: sharedPasswordHash,
    },
  });

  const recipientUser = await prisma.user.upsert({
    where: { email: "sarah.connor@example.test" },
    update: {
      name: "Sarah Connor",
      role: "RECIPIENT",
      passwordHash: sharedPasswordHash,
    },
    create: {
      id: "user-recipient-1",
      name: "Sarah Connor",
      email: "sarah.connor@example.test",
      role: "RECIPIENT",
      passwordHash: sharedPasswordHash,
    },
  });

  console.log(
    `✅ 3 Synthetic RBAC Users upserted (${owner1.email}, ${owner2.email}, ${recipientUser.email}).`
  );

  // 2. Seed Trusted Recipients (Idempotent via upsert, domain sintetis @example.test)
  const recipientsData = [
    {
      id: "rec-1",
      name: "Sarah Connor",
      role: "Emergency Trustee",
      email: "sarah.connor@example.test",
      ownerId: owner1.id,
    },
    {
      id: "rec-2",
      name: "Alex Vance",
      role: "Legal Counsel",
      email: "alex.vance@example.test",
      ownerId: owner1.id,
    },
    {
      id: "rec-3",
      name: "Michael Scott",
      role: "Next of Kin",
      email: "michael.scott@example.test",
      ownerId: owner1.id,
    },
    {
      id: "rec-4",
      name: "Elena Rostova",
      role: "Cryptographic Escrow",
      email: "elena.rostova@example.test",
      ownerId: owner1.id,
    },
    {
      id: "rec-owner2",
      name: "Dimas Mahendra",
      role: "External Auditor",
      email: "dimas.mahendra@example.test",
      ownerId: owner2.id,
    },
  ];

  for (const r of recipientsData) {
    await prisma.recipient.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        role: r.role,
        email: r.email,
        ownerId: r.ownerId,
      },
      create: r,
    });
  }
  console.log(`✅ ${recipientsData.length} Emergency Recipients upserted.`);

  // 3. Seed Vaults dengan Description Terenkripsi AES-256-GCM + AAD Kontekstual
  const vaultsData = [
    {
      id: "v-1",
      name: "Important Documents",
      plainDescription: "Legal papers, credentials, and identity certificates",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "30 days",
      gracePeriod: "48 hours",
      lastUpdated: "Updated 2 hours ago",
      nextCheckIn: "6 days 14 hours",
      lastCheckIn: "3 days ago (11:24 UTC)",
      recipientId: "rec-1",
      ownerId: owner1.id,
      files: [
        { name: "passport_scan_verified.pdf.enc", size: "2.4 MB", cipher: "AES-256 GCM" },
        { name: "birth_certificate_notarized.pdf.enc", size: "1.8 MB", cipher: "AES-256 GCM" },
        { name: "tax_identification_2025.pdf.enc", size: "850 KB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-2",
      name: "Personal Archive",
      plainDescription: "Private keys, personal memoirs, and digital journals",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "14 days",
      gracePeriod: "48 hours",
      lastUpdated: "Updated yesterday",
      nextCheckIn: "11 days 08 hours",
      lastCheckIn: "Yesterday (18:40 UTC)",
      recipientId: "rec-3",
      ownerId: owner1.id,
      files: [
        { name: "personal_memoirs_vol1.enc", size: "4.2 MB", cipher: "AES-256 GCM" },
        { name: "pgp_private_keyring.asc.enc", size: "128 KB", cipher: "AES-256 GCM" },
        { name: "digital_diary_encrypted.sqlite.enc", size: "14.5 MB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-3",
      name: "Emergency Data",
      plainDescription: "Emergency contacts, health records, and estate instructions",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "7 days",
      gracePeriod: "24 hours",
      lastUpdated: "Updated 3 days ago",
      nextCheckIn: "4 days 02 hours",
      lastCheckIn: "3 days ago (09:15 UTC)",
      recipientId: "rec-2",
      ownerId: owner1.id,
      files: [
        { name: "emergency_medical_directives.pdf.enc", size: "1.1 MB", cipher: "AES-256 GCM" },
        { name: "estate_trustee_contact_dossier.pdf.enc", size: "640 KB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-4",
      name: "Crypto Cold Storage",
      plainDescription: "Hardware wallet seeds, BIP-39 mnemonics, and multi-sig recovery shards",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "30 days",
      gracePeriod: "72 hours",
      lastUpdated: "Updated 4 days ago",
      nextCheckIn: "26 days 00 hours",
      lastCheckIn: "4 days ago (14:05 UTC)",
      recipientId: "rec-4",
      ownerId: owner1.id,
      files: [
        { name: "ledger_bip39_master_seed.txt.enc", size: "16 KB", cipher: "AES-256 GCM" },
        { name: "multisig_descriptor_2of3.json.enc", size: "42 KB", cipher: "AES-256 GCM" },
        { name: "coldcard_backup_shard_a.bin.enc", size: "128 KB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-5",
      name: "Financial & Asset Deeds",
      plainDescription: "Tax returns, title deeds, insurance policies, and offshore bank accounts",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "30 days",
      gracePeriod: "72 hours",
      lastUpdated: "Updated 1 week ago",
      nextCheckIn: "23 days 10 hours",
      lastCheckIn: "7 days ago (08:30 UTC)",
      recipientId: "rec-2",
      ownerId: owner1.id,
      files: [
        { name: "property_title_deed_jakarta.pdf.enc", size: "5.6 MB", cipher: "AES-256 GCM" },
        { name: "annual_tax_returns_2025.pdf.enc", size: "3.1 MB", cipher: "AES-256 GCM" },
        { name: "life_insurance_policy_escrow.pdf.enc", size: "1.9 MB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-6",
      name: "Master Recovery Escrow",
      plainDescription: "Secondary emergency split-key shards awaiting recipient confirmation",
      status: "PENDING",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "14 days",
      gracePeriod: "48 hours",
      lastUpdated: "Pending verification",
      nextCheckIn: "Awaiting recipient key handshake",
      lastCheckIn: "Pending initial activation",
      recipientId: "rec-4",
      ownerId: owner1.id,
      files: [
        { name: "shamir_master_escrow_shard_01.key.enc", size: "64 KB", cipher: "AES-256 GCM" },
      ],
    },
    {
      id: "v-owner2",
      name: "Isolated Secondary Owner Vault",
      plainDescription: "Private vault owned by Raka Pratama for anti-IDOR isolation testing",
      status: "ACTIVE",
      encryptionStatus: "AES-256 GCM",
      checkInInterval: "30 days",
      gracePeriod: "48 hours",
      lastUpdated: "Updated 1 hour ago",
      nextCheckIn: "29 days 23 hours",
      lastCheckIn: "1 hour ago",
      recipientId: "rec-owner2",
      ownerId: owner2.id,
      files: [
        { name: "owner2_private_deed.pdf.enc", size: "1.2 MB", cipher: "AES-256 GCM" },
      ],
    },
  ];

  for (const v of vaultsData) {
    const { files, plainDescription, ...vaultFields } = v;
    const encryptedDescription = encryptVaultField(
      plainDescription,
      v.id,
      "description"
    );

    await prisma.vault.upsert({
      where: { id: v.id },
      update: {
        ...vaultFields,
        description: encryptedDescription,
      },
      create: {
        ...vaultFields,
        description: encryptedDescription,
      },
    });

    // Pastikan daftar file awal sinkron dan idempotent
    await prisma.vaultFile.deleteMany({ where: { vaultId: v.id } });
    await prisma.vaultFile.createMany({
      data: files.map((f) => ({
        ...f,
        vaultId: v.id,
      })),
    });
  }
  console.log(
    `✅ ${vaultsData.length} Vaults upserted with AES-256-GCM encrypted descriptions and AAD binding.`
  );

  // 3b. Migrasi data lama hasil praktikum (jika ada baris dengan ownerId null atau description plaintext)
  const legacyVaults = await prisma.vault.findMany();
  for (const lv of legacyVaults) {
    const needsOwner = !lv.ownerId;
    const needsEncryption =
      lv.description !== null &&
      lv.description.trim().length > 0 &&
      !isEncryptedPayload(lv.description);

    if (needsOwner || needsEncryption) {
      await prisma.vault.update({
        where: { id: lv.id },
        data: {
          ownerId: lv.ownerId ?? owner1.id,
          description: needsEncryption
            ? encryptVaultField(lv.description!, lv.id, "description")
            : lv.description,
        },
      });
      console.log(`🔒 Migrated legacy vault ${lv.id} to AES-256-GCM + RBAC owner.`);
    }
  }

  const legacyRecipients = await prisma.recipient.findMany({
    where: { ownerId: null },
  });
  for (const lr of legacyRecipients) {
    await prisma.recipient.update({
      where: { id: lr.id },
      data: { ownerId: owner1.id },
    });
  }

  // 4. Seed Activities (Idempotent)
  await prisma.activity.deleteMany();
  const activities = [
    {
      title: "Vault created",
      description: "Important Documents vault was created and sealed with AES-256-GCM",
      timestamp: "2 hours ago",
      type: "vault",
    },
    {
      title: "File encrypted",
      description: "passport_scan_verified.pdf.enc was encrypted with AAD binding",
      timestamp: "Yesterday",
      type: "file",
    },
    {
      title: "Check-in completed",
      description: "Dead Man's Switch timer was reset",
      timestamp: "3 days ago",
      type: "checkin",
    },
    {
      title: "Recipient updated",
      description: "Trusted recipient sarah.connor@example.test was verified",
      timestamp: "5 days ago",
      type: "recipient",
    },
  ];

  await prisma.activity.createMany({ data: activities });
  console.log(`✅ ${activities.length} Activity log entries seeded.`);

  // 5. Seed CheckIn Status (Idempotent)
  const existingCheckIn = await prisma.checkIn.findFirst();
  if (existingCheckIn) {
    await prisma.checkIn.update({
      where: { id: existingCheckIn.id },
      data: {
        status: "ACTIVE",
        nextCheckIn: "6 days 14 hours",
        cyclePercent: 78,
        method: "Hardware Security Token / Passkey (AES-GCM Authenticated)",
      },
    });
  } else {
    await prisma.checkIn.create({
      data: {
        status: "ACTIVE",
        nextCheckIn: "6 days 14 hours",
        cyclePercent: 78,
        method: "Hardware Security Token / Passkey (AES-GCM Authenticated)",
      },
    });
  }
  console.log("✅ Dead Man's Switch check-in status seeded.");
  console.log("🚀 Idempotent database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
