import React from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { VaultIcon, LockIcon, ShieldCheckIcon } from "@/components/Icons";

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      {/* 1. Left Sidebar (Persistent across all /vault/* routes) */}
      <Sidebar
        activeItem="My Vault"
        userName="Ilham"
        userStatus="Protected"
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 2. Top Navbar */}
        <Navbar
          title="My Vault"
          userName="Ilham"
          userStatus="Protected"
        />

        {/* 3. Vault Nested Layout Identity Header */}
        <div
          aria-label="Vault Subsystem Header"
          className="border-b border-zinc-800/80 bg-zinc-950/70 px-4 py-3 sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <VaultIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-xs font-bold tracking-wider text-zinc-100 uppercase">
                    LastKey Vault Area
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
                    <LockIcon className="h-2.5 w-2.5" />
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Nested Vault Layout • Zero-Knowledge Compartment Subsystem
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/vault"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                All Vaults
              </Link>
              <Link
                href="/vault/v-1"
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                v-1
              </Link>
              <Link
                href="/vault/v-2"
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                v-2
              </Link>
              <Link
                href="/vault/v-3"
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                v-3
              </Link>
              <span className="hidden items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 sm:inline-flex">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>Zero-Knowledge</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4. Vault Main Container (Wraps template.tsx, loading.tsx, error.tsx, page.tsx, [id]/page.tsx) */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {children}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

