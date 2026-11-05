import React from "react";
import { LockIcon } from "@/components/Icons";

export default function VaultLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading encrypted vault compartments"
      className="space-y-8"
    >
      {/* Top Status Banner */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-4 py-3 text-xs text-emerald-400">
        <div className="flex items-center gap-2.5">
          <LockIcon className="h-4 w-4 animate-pulse text-emerald-400" />
          <span className="font-mono tracking-wider uppercase">
            Initializing Zero-Knowledge Vault Subsystem...
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-400">
          AES-256-GCM
        </span>
      </div>

      {/* Hero Section Skeleton */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-7 animate-pulse">
        <div className="h-3.5 w-44 rounded bg-zinc-800" />
        <div className="mt-3 h-7 w-64 rounded-lg bg-zinc-800/90" />
        <div className="mt-2.5 h-4 w-96 max-w-full rounded bg-zinc-800/70" />
      </div>

      {/* 4 StatCards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2.5">
                <div className="h-3 w-24 rounded bg-zinc-800" />
                <div className="h-7 w-16 rounded bg-zinc-800/90" />
                <div className="h-3 w-28 rounded bg-zinc-800/70" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-zinc-800" />
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Vault Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <div
            key={card}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-zinc-800" />
              <div className="h-5 w-16 rounded-full bg-zinc-800" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-5 w-40 rounded bg-zinc-800/90" />
              <div className="h-3.5 w-28 rounded bg-zinc-800/70" />
              <div className="h-3 w-full rounded bg-zinc-800/60" />
            </div>
            <div className="mt-5 h-9 w-full rounded-lg bg-zinc-800/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

