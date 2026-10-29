import React from "react";
import Link from "next/link";
import { VaultIcon, LockIcon, ChevronRightIcon } from "./Icons";

export interface MockFile {
  name: string;
  size: string;
  cipher: string;
}

export interface MockRecipient {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface VaultItem {
  id: string;
  name: string;
  fileCount: string;
  status: "ACTIVE" | "LOCKED" | "PENDING";
  encryptionStatus: string;
  lastUpdated: string;
  description?: string;
  recipient?: MockRecipient;
  checkInInterval?: string;
  gracePeriod?: string;
  nextCheckIn?: string;
  lastCheckIn?: string;
  files?: MockFile[];
}

export const MOCK_RECIPIENTS: MockRecipient[] = [
  {
    id: "rec-1",
    name: "Sarah Connor",
    role: "Emergency Trustee",
    email: "sarah@trustee-key.org",
  },
  {
    id: "rec-2",
    name: "Alex Vance",
    role: "Legal Counsel",
    email: "alex@vance-legal.com",
  },
  {
    id: "rec-3",
    name: "Michael Scott",
    role: "Next of Kin",
    email: "m.scott@familyvault.net",
  },
  {
    id: "rec-4",
    name: "Elena Rostova",
    role: "Cryptographic Escrow",
    email: "elena@escrow-keys.io",
  },
];

export const MOCK_VAULT_FILES: Record<string, MockFile[]> = {
  "v-1": [
    { name: "passport_scan_verified.pdf.enc", size: "2.4 MB", cipher: "AES-256 GCM" },
    { name: "birth_certificate_notarized.pdf.enc", size: "1.8 MB", cipher: "AES-256 GCM" },
    { name: "tax_identification_2025.pdf.enc", size: "850 KB", cipher: "AES-256 GCM" },
  ],
  "v-2": [
    { name: "personal_memoirs_vol1.enc", size: "4.2 MB", cipher: "AES-256 GCM" },
    { name: "pgp_private_keyring.asc.enc", size: "128 KB", cipher: "AES-256 GCM" },
    { name: "digital_diary_encrypted.sqlite.enc", size: "14.5 MB", cipher: "AES-256 GCM" },
  ],
  "v-3": [
    { name: "emergency_medical_directives.pdf.enc", size: "1.1 MB", cipher: "AES-256 GCM" },
    { name: "estate_trustee_contact_dossier.pdf.enc", size: "640 KB", cipher: "AES-256 GCM" },
  ],
  "v-4": [
    { name: "ledger_bip39_master_seed.txt.enc", size: "16 KB", cipher: "AES-256 GCM" },
    { name: "multisig_descriptor_2of3.json.enc", size: "42 KB", cipher: "AES-256 GCM" },
    { name: "coldcard_backup_shard_a.bin.enc", size: "128 KB", cipher: "AES-256 GCM" },
  ],
  "v-5": [
    { name: "property_title_deed_jakarta.pdf.enc", size: "5.6 MB", cipher: "AES-256 GCM" },
    { name: "annual_tax_returns_2025.pdf.enc", size: "3.1 MB", cipher: "AES-256 GCM" },
    { name: "life_insurance_policy_escrow.pdf.enc", size: "1.9 MB", cipher: "AES-256 GCM" },
  ],
  "v-6": [
    { name: "shamir_master_escrow_shard_01.key.enc", size: "64 KB", cipher: "ChaCha20-Poly1305" },
  ],
};

export const INITIAL_VAULTS: VaultItem[] = [
  {
    id: "v-1",
    name: "Important Documents",
    fileCount: "3 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 2 hours ago",
    description: "Legal papers, credentials, and identity certificates",
    recipient: MOCK_RECIPIENTS[0],
    checkInInterval: "30 days (Standard 30-day release cycle)",
    gracePeriod: "48 hours (Standard grace period)",
    nextCheckIn: "6 days 14 hours",
    lastCheckIn: "3 days ago (11:24 UTC)",
    files: MOCK_VAULT_FILES["v-1"],
  },
  {
    id: "v-2",
    name: "Personal Archive",
    fileCount: "8 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated yesterday",
    description: "Private keys, personal memoirs, and digital journals",
    recipient: MOCK_RECIPIENTS[2],
    checkInInterval: "14 days (Bi-weekly heartbeat)",
    gracePeriod: "48 hours (Standard grace period)",
    nextCheckIn: "11 days 08 hours",
    lastCheckIn: "Yesterday (18:40 UTC)",
    files: MOCK_VAULT_FILES["v-2"],
  },
  {
    id: "v-3",
    name: "Emergency Data",
    fileCount: "2 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 3 days ago",
    description: "Emergency contacts, health records, and estate instructions",
    recipient: MOCK_RECIPIENTS[1],
    checkInInterval: "7 days (Weekly heartbeat)",
    gracePeriod: "24 hours (Urgent fail-safe window)",
    nextCheckIn: "4 days 02 hours",
    lastCheckIn: "3 days ago (09:15 UTC)",
    files: MOCK_VAULT_FILES["v-3"],
  },
  {
    id: "v-4",
    name: "Crypto Cold Storage",
    fileCount: "5 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 4 days ago",
    description: "Hardware wallet seeds, BIP-39 mnemonics, and multi-sig recovery shards",
    recipient: MOCK_RECIPIENTS[3],
    checkInInterval: "30 days (Standard 30-day release cycle)",
    gracePeriod: "72 hours (Extended emergency buffer)",
    nextCheckIn: "26 days 00 hours",
    lastCheckIn: "4 days ago (14:05 UTC)",
    files: MOCK_VAULT_FILES["v-4"],
  },
  {
    id: "v-5",
    name: "Financial & Asset Deeds",
    fileCount: "12 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 1 week ago",
    description: "Tax returns, title deeds, insurance policies, and offshore bank accounts",
    recipient: MOCK_RECIPIENTS[1],
    checkInInterval: "30 days (Standard 30-day release cycle)",
    gracePeriod: "72 hours (Extended emergency buffer)",
    nextCheckIn: "23 days 10 hours",
    lastCheckIn: "7 days ago (08:30 UTC)",
    files: MOCK_VAULT_FILES["v-5"],
  },
  {
    id: "v-6",
    name: "Master Recovery Escrow",
    fileCount: "1 encrypted file",
    status: "PENDING",
    encryptionStatus: "ChaCha20-Poly1305",
    lastUpdated: "Pending verification",
    description: "Secondary emergency split-key shards awaiting recipient confirmation",
    recipient: MOCK_RECIPIENTS[3],
    checkInInterval: "14 days (Bi-weekly heartbeat)",
    gracePeriod: "48 hours (Standard grace period)",
    nextCheckIn: "Awaiting recipient key handshake",
    lastCheckIn: "Pending initial activation",
    files: MOCK_VAULT_FILES["v-6"],
  },
];

export function getVaultById(id: string): VaultItem | undefined {
  return INITIAL_VAULTS.find((vault) => vault.id === id);
}

export interface VaultCardProps {
  vault: VaultItem;
  onManage?: (id: string) => void;
}

export function VaultCard({ vault, onManage }: VaultCardProps) {
  const handleManageClick = () => {
    if (onManage) {
      onManage(vault.id);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/60">
      <div>
        {/* Top header: Icon & Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/50 text-emerald-400 group-hover:border-zinc-700">
              <VaultIcon className="h-5 w-5" />
            </div>
            <span className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
              {vault.id}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              vault.status === "PENDING"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                vault.status === "PENDING" ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span>{vault.status}</span>
          </div>
        </div>

        {/* Vault Info */}
        <div className="mt-4">
          <Link
            href={`/vault/${vault.id}`}
            className="text-base font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors hover:underline"
          >
            {vault.name}
          </Link>
          <p className="mt-1 text-xs text-zinc-400">{vault.fileCount}</p>
          {vault.description && (
            <p className="mt-2 line-clamp-2 text-xs text-zinc-400/90 leading-relaxed">
              {vault.description}
            </p>
          )}
        </div>

        {/* Encryption & Security Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded bg-zinc-800/70 px-2 py-0.5 font-mono text-[11px] text-zinc-300 border border-zinc-700/50">
            <LockIcon className="h-3 w-3 text-emerald-400" />
            {vault.encryptionStatus}
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-[11px] text-zinc-400">{vault.lastUpdated}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center gap-2 pt-2">
        <Link
          href={`/vault/${vault.id}`}
          aria-label={`View details for vault ${vault.name}`}
          className="flex flex-1 items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <span>View Details</span>
          <ChevronRightIcon className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {onManage && (
          <button
            type="button"
            onClick={handleManageClick}
            aria-label={`Quick inspect vault ${vault.name}`}
            className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <span>Quick Inspect</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default VaultCard;

