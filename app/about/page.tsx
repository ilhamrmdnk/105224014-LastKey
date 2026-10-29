import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import Footer from "@/components/Footer";
import {
  KeyIcon,
  VaultIcon,
  PulseIcon,
  ShieldCheckIcon,
  LockIcon,
  UsersIcon,
  ChevronRightIcon,
} from "@/components/Icons";

export const metadata: Metadata = {
  title: "About LastKey — Secure Digital Vault",
  description:
    "Learn about LastKey, Zero-Knowledge Secure Digital Vault compartments, and the Dead Man's Switch emergency release protocol.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeItem="About"
        userName="Ilham"
        userStatus="Protected"
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 2. Top Navbar */}
        <Navbar
          title="About LastKey"
          userName="Ilham"
          userStatus="Protected"
        />

        {/* Main Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Top Back Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <span aria-hidden="true">&larr;</span>
                  <span>Back to Dashboard</span>
                </Link>
                <span className="hidden text-zinc-600 sm:inline">|</span>
                <span className="hidden text-xs text-zinc-400 sm:inline">
                  Platform Architecture &amp; Security Overview
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/vault"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-emerald-300"
                >
                  <VaultIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Open My Vault</span>
                </Link>
                <Link
                  href="/check-in"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  <PulseIcon className="h-3.5 w-3.5" />
                  <span>Check-in Console</span>
                </Link>
              </div>
            </div>

            {/* Hero Section: About LastKey */}
            <section
              aria-label="About LastKey"
              className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-[#090a0f] p-6 shadow-sm sm:p-8"
            >
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <KeyIcon className="h-3.5 w-3.5" />
                  <span className="font-mono tracking-wider uppercase">
                    ZERO-KNOWLEDGE DIGITAL CONTINUITY
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                  About LastKey
                </h1>

                <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                  <strong>LastKey</strong> adalah platform{" "}
                  <span className="text-emerald-400 font-medium">
                    Secure Digital Vault
                  </span>{" "}
                  dengan mekanisme{" "}
                  <span className="text-emerald-400 font-medium">
                    Dead Man&apos;s Switch
                  </span>{" "}
                  yang dirancang untuk melindungi aset digital kritis — seperti
                  kunci kriptografi, dokumen hukum, arsip pribadi, dan instruksi
                  darurat — serta memastikan pewarisan akses secara aman kepada
                  penerima terpercaya ketika pemilik tidak lagi dapat dihubungi.
                </p>
              </div>
            </section>

            {/* Architecture Highlights (StatCards) */}
            <section aria-label="Security Specifications">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Cipher Standard"
                  value="AES-256"
                  description="Authenticated GCM mode"
                  icon={<LockIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="NIST SP 800-38D"
                />
                <StatCard
                  title="Privacy Model"
                  value="Zero-Knowledge"
                  description="Client-side key derivation"
                  icon={<ShieldCheckIcon className="h-5 w-5" />}
                  badge="End-to-End"
                />
                <StatCard
                  title="Switch Trigger"
                  value="Heartbeat"
                  description="Proof-of-life check-in"
                  icon={<PulseIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Autonomous"
                />
                <StatCard
                  title="Key Escrow"
                  value="Shamir Split"
                  description="Verified trustee release"
                  icon={<UsersIcon className="h-5 w-5" />}
                  badge="Multi-party"
                />
              </div>
            </section>

            {/* Core Concepts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Concept 1: Secure Digital Vault */}
              <section
                aria-label="Konsep Secure Digital Vault"
                className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <VaultIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">
                        Konsep Secure Digital Vault
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Zero-Knowledge Encrypted Compartments
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    Setiap kompartemen di dalam LastKey berfungsi sebagai brankas
                    digital terisolasi yang mengenkripsi dokumen dan kredensial
                    penting menggunakan algoritma{" "}
                    <span className="font-mono text-emerald-400">
                      AES-256-GCM
                    </span>{" "}
                    sebelum data disimpan.
                  </p>

                  <ul className="space-y-2.5 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>
                        <strong className="text-zinc-200">
                          Isolasi Kompartemen:
                        </strong>{" "}
                        Data dikelompokkan per kategori (dokumen hukum, arsip
                        pribadi, cold storage kripto) dengan penerima darurat
                        yang spesifik.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>
                        <strong className="text-zinc-200">
                          Integritas Kriptografi:
                        </strong>{" "}
                        Menggunakan 96-bit nonce acak dan 128-bit authentication
                        tag untuk mencegah manipulasi ciphertext (tamper-proof).
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-zinc-800/60 pt-4">
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    <span>Explore Encrypted Vaults</span>
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>

              {/* Concept 2: Dead Man's Switch */}
              <section
                aria-label="Konsep Dead Man's Switch"
                className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <PulseIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">
                        Konsep Dead Man&apos;s Switch
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Automated Proof-of-Life &amp; Emergency Release
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    <strong>Dead Man&apos;s Switch</strong> adalah protokol
                    otomatis yang memantau keaktifan pemilik vault melalui
                    konfirmasi kehadiran berkala (
                    <em>proof-of-life heartbeat check-in</em>). Selama pengguna
                    melakukan check-in tepat waktu, seluruh vault tetap terkunci
                    rapat.
                  </p>

                  <ul className="space-y-2.5 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>
                        <strong className="text-zinc-200">
                          Check-in Interval &amp; Grace Period:
                        </strong>{" "}
                        Pengguna menentukan siklus check-in (7, 14, atau 30
                        hari) beserta masa tenggang peringatan darurat sebelum
                        sistem mengambil tindakan.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>
                        <strong className="text-zinc-200">
                          Emergency Key Release:
                        </strong>{" "}
                        Apabila batas waktu dan masa tenggang habis tanpa
                        respons, shard kunci dekripsi dikirimkan secara aman
                        kepada <em>Emergency Recipient</em> yang telah ditunjuk.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-zinc-800/60 pt-4">
                  <Link
                    href="/check-in"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    <span>Open Heartbeat &amp; Check-in Console</span>
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

