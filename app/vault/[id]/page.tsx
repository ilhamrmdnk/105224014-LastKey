import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatCard from "@/components/StatCard";
import {
  INITIAL_VAULTS,
  MOCK_VAULT_FILES,
  getVaultById,
} from "@/components/VaultCard";
import {
  VaultIcon,
  LockIcon,
  ShieldCheckIcon,
  PulseIcon,
  TimerIcon,
  UsersIcon,
  FileTextIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "@/components/Icons";

interface VaultDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * generateStaticParams()
 * Menghasilkan static route parameter saat build untuk seluruh ID vault yang tersedia
 * (v-1, v-2, v-3, v-4, v-5, v-6).
 */
export async function generateStaticParams() {
  return INITIAL_VAULTS.map((vault) => ({
    id: vault.id,
  }));
}

export async function generateMetadata({
  params,
}: VaultDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const vault = getVaultById(resolvedParams.id);

  if (!vault) {
    return {
      title: "Vault Not Found — LastKey",
    };
  }

  return {
    title: `${vault.name} (${vault.id}) — LastKey Vault`,
    description: vault.description,
  };
}

export default async function VaultDetailPage({
  params,
}: VaultDetailPageProps) {
  const resolvedParams = await params;
  const vaultId = resolvedParams.id;
  const vault = getVaultById(vaultId);

  if (!vault) {
    notFound();
  }

  const encryptedFiles = vault.files || MOCK_VAULT_FILES[vault.id] || [];

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Back Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/vault"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to My Vault</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-zinc-400">Compartment</span>
          <span className="text-zinc-600">/</span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono font-semibold text-emerald-400">
            {vault.id}
          </span>
        </div>

        <Link
          href="/check-in"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          <PulseIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dead Man&apos;s Switch Console</span>
          <ChevronRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Vault Detail Hero Card */}
      <section
        aria-label="Vault Compartment Summary"
        className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-[#090a0f] p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-200">
                ID: {vault.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  vault.status === "PENDING"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full animate-pulse ${
                    vault.status === "PENDING"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span>{vault.status}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                <LockIcon className="h-3.5 w-3.5 text-emerald-400" />
                {vault.encryptionStatus}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              {vault.name}
            </h1>

            <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
              {vault.description ||
                "Zero-knowledge encrypted digital vault compartment."}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 text-xs sm:min-w-[240px]">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Vault Identifier</span>
              <span className="font-mono font-bold text-emerald-400">
                {vault.id}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Last Updated</span>
              <span className="font-medium text-zinc-200">
                {vault.lastUpdated}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Payload Count</span>
              <span className="font-medium text-zinc-200">
                {vault.fileCount}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Metric Cards for this Vault */}
      <section aria-label="Vault Compartment Telemetry">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Vault Status"
            value={vault.status}
            description={`Compartment ${vault.id}`}
            icon={<VaultIcon className="h-5 w-5" />}
            isAccent={vault.status === "ACTIVE"}
            badge={vault.encryptionStatus}
          />
          <StatCard
            title="Encrypted Files"
            value={encryptedFiles.length.toString()}
            description={vault.fileCount}
            icon={<FileTextIcon className="h-5 w-5" />}
            badge="Zero-Knowledge"
          />
          <StatCard
            title="Next Check-in"
            value={vault.nextCheckIn ? vault.nextCheckIn.split(" ")[0] + "d" : "30d"}
            description={vault.nextCheckIn || "6 days 14 hours remaining"}
            icon={<TimerIcon className="h-5 w-5" />}
            isAccent={true}
            badge="Monitored"
          />
          <StatCard
            title="Emergency Recipient"
            value={vault.recipient ? vault.recipient.name.split(" ")[0] : "Assigned"}
            description={vault.recipient ? vault.recipient.role : "Trusted Escrow"}
            icon={<UsersIcon className="h-5 w-5" />}
            badge="Verified"
          />
        </div>
      </section>

      {/* Main Detail Grid: Encrypted Files (Left) & Recipient + Check-in Config (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Encrypted Payload Files */}
        <div className="space-y-6 lg:col-span-7">
          <section
            aria-label="Encrypted Payload Files"
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <FileTextIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100 sm:text-base">
                    Encrypted Payload Manifest
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {vault.fileCount} stored in compartment{" "}
                    <span className="font-mono text-zinc-300">{vault.id}</span>
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400">
                {encryptedFiles.length} Object(s)
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {encryptedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-zinc-900/70 p-3.5 text-xs transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/60 text-emerald-400">
                      <LockIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-zinc-100">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Authenticated Tag • Client-side sealed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono text-xs text-zinc-400">
                      {file.size}
                    </span>
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                      {file.cipher}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                <span>Zero-Knowledge Cryptographic Isolation</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-300/90">
                All files inside <span className="font-mono">{vault.id}</span>{" "}
                are sealed locally using {vault.encryptionStatus}. Decryption
                keys are split into Shamir shards and cannot be accessed without
                your master passphrase or a verified Dead Man&apos;s Switch
                release event.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Emergency Recipient & Check-in Configuration */}
        <div className="space-y-6 lg:col-span-5">
          {/* Emergency Recipient Card */}
          <section
            aria-label="Emergency Recipient Details"
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2.5 border-b border-zinc-800/60 pb-3.5">
              <UsersIcon className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Designated Emergency Recipient
              </h2>
            </div>

            {vault.recipient ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {vault.recipient.name}
                    </p>
                    <p className="text-xs text-emerald-400">
                      {vault.recipient.role}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">
                      {vault.recipient.email}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Recipient identity key fingerprint is verified. Key shards
                  will only be dispatched if the Dead Man&apos;s Switch
                  countdown and grace period expire without a check-in.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-400">
                No emergency recipient assigned.
              </p>
            )}
          </section>

          {/* Check-in & Heartbeat Schedule Card */}
          <section
            aria-label="Check-in Policy Configuration"
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2.5 border-b border-zinc-800/60 pb-3.5">
              <PulseIcon className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Dead Man&apos;s Switch &amp; Check-in Policy
              </h2>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                <span className="text-zinc-400">Heartbeat Interval</span>
                <span className="font-mono font-medium text-zinc-200">
                  {vault.checkInInterval || "30 days"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                <span className="text-zinc-400">Fail-Safe Grace Period</span>
                <span className="font-mono font-medium text-zinc-200">
                  {vault.gracePeriod || "48 hours"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                <span className="text-zinc-400">Last Confirmed Check-in</span>
                <span className="font-mono font-medium text-emerald-400">
                  {vault.lastCheckIn || "3 days ago"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5">
                <span className="text-zinc-400">Next Scheduled Check-in</span>
                <span className="font-mono font-medium text-zinc-100">
                  {vault.nextCheckIn || "6 days 14 hours"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Compartment Switcher & Back Navigation */}
      <section
        aria-label="Switch Vault Compartment"
        className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-5 sm:flex-row sm:items-center"
      >
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Quick Compartment Switcher
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Navigate directly between dynamic vault routes or return to the
            vault list.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {INITIAL_VAULTS.map((item) => (
            <Link
              key={item.id}
              href={`/vault/${item.id}`}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-medium transition-colors ${
                item.id === vault.id
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {item.id}
            </Link>
          ))}
          <Link
            href="/vault"
            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
          >
            <span>&larr; Back to /vault</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

