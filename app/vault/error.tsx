"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from "@/components/Icons";

export default function VaultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LastKey Vault Error Boundary]:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div
        role="alert"
        className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-[#0c0e14] p-6 text-center shadow-xl sm:p-10"
      >
        {/* Error Badge */}
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-400">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          <span className="font-mono tracking-wider uppercase">
            Vault Subsystem Runtime Error
          </span>
        </div>

        {/* Icon */}
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-400">
          <AlertTriangleIcon className="h-8 w-8" />
        </div>

        {/* Heading & Error Message */}
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Something went wrong in Vault
        </h2>
        <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
          {error.message ||
            "An unexpected error occurred while accessing the encrypted vault compartment."}
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-zinc-500">
            Error Digest: {error.digest}
          </p>
        )}

        {/* Security Assurance Note */}
        <div className="mx-auto mt-6 max-w-lg rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-left text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Zero-Knowledge Vault Integrity Intact</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-300/90">
            Your encrypted payloads and Dead Man&apos;s Switch timers remain
            safely isolated and unaffected by this UI error.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <span>Try again</span>
          </button>

          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <span>Return to /vault</span>
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

