import React from "react";
import Link from "next/link";
import { INITIAL_VAULTS } from "@/components/VaultCard";
import {
  AlertTriangleIcon,
  VaultIcon,
  LockIcon,
  ChevronRightIcon,
} from "@/components/Icons";

export default function VaultNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 via-zinc-900/40 to-[#0c0e14] p-6 text-center shadow-xl sm:p-10">
        {/* Status Badge */}
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-400">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          <span className="font-mono tracking-wider">
            ERROR 404 • VAULT_ID_NOT_FOUND
          </span>
        </div>

        {/* Icon */}
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-emerald-400 shadow-inner">
          <VaultIcon className="h-8 w-8" />
        </div>

        {/* Heading & Description */}
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Vault Not Found
        </h1>
        <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
          Vault yang kamu cari tidak tersedia. ID kompartemen mungkin salah,
          belum dibuat, atau telah dihapus dari registri enkripsi LastKey.
        </p>

        {/* Available Vault IDs Hint */}
        <div className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <LockIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>Available Encrypted Vault Compartments:</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INITIAL_VAULTS.map((vault) => (
              <Link
                key={vault.id}
                href={`/vault/${vault.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                <span className="font-mono font-semibold text-emerald-400">
                  {vault.id}
                </span>
                <span className="text-zinc-500">—</span>
                <span>{vault.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/vault"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <span>&larr; Kembali ke /vault</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <span>Dashboard</span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

