import React from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AlertTriangleIcon,
  KeyIcon,
  VaultIcon,
  PulseIcon,
  ChevronRightIcon,
} from "@/components/Icons";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      {/* Left Sidebar */}
      <Sidebar activeItem="" userName="Ilham" userStatus="Protected" />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <Navbar
          title="404 Not Found"
          userName="Ilham"
          userStatus="Protected"
        />

        <main className="flex flex-1 flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-8">
            <div className="w-full rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 via-zinc-900/40 to-[#0c0e14] p-6 text-center shadow-2xl sm:p-10">
              {/* 404 Security Status Pill */}
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-400">
                <AlertTriangleIcon className="h-3.5 w-3.5" />
                <span className="font-mono tracking-wider uppercase">
                  HTTP 404 • ROUTE_NOT_FOUND
                </span>
              </div>

              {/* Icon */}
              <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <KeyIcon className="h-8 w-8" />
              </div>

              {/* Heading & Message */}
              <h1 className="mt-5 font-mono text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
                404 — Page Not Found
              </h1>
              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Halaman atau endpoint yang kamu akses tidak terdaftar di dalam
                sistem LastKey. Pastikan URL sudah benar atau gunakan navigasi
                di bawah untuk kembali ke area yang terlindungi.
              </p>

              {/* Quick Navigation Links */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <span>&larr; Back to Dashboard</span>
                </Link>

                <Link
                  href="/vault"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <VaultIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>My Vault</span>
                </Link>

                <Link
                  href="/check-in"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <PulseIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Check-in</span>
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  <span>About</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

