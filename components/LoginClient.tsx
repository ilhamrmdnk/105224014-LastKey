"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheckIcon,
  LockIcon,
  KeyIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import {
  loginAction,
  logoutAction,
  switchDemoAccountAction,
} from "@/lib/actions/auth-actions";
import type { SessionUser } from "@/lib/auth";

export interface LoginClientProps {
  initialSession: SessionUser | null;
}

export default function LoginClient({ initialSession }: LoginClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(initialSession);
  const [email, setEmail] = useState("owner@example.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await loginAction({ email, password });
      if (!res.success || !res.user) {
        setError(res.error || "Autentikasi gagal.");
        setLoading(false);
        return;
      }
      setSession(res.user);
      setPassword("");
      setNotice(
        `Berhasil login sebagai ${res.user.name} (${res.user.role}) dengan verifikasi bcrypt.`
      );
      router.refresh();
    } catch {
      setError("Gagal menghubungi server autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (
    target:
      | "owner@example.test"
      | "owner2@example.test"
      | "sarah.connor@example.test"
      | "LOGOUT"
  ) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (target === "LOGOUT") {
        await logoutAction();
        setSession(null);
        setNotice("Sesi telah dihapus (UNAUTHENTICATED).");
      } else {
        const res = await switchDemoAccountAction(target);
        if (!res.success || !res.user) {
          setError(res.error || "Gagal mengganti akun uji.");
          setLoading(false);
          return;
        }
        setSession(res.user);
        setEmail(res.user.email);
        setNotice(
          `Sesi aktif berpindah ke ${res.user.name} (${res.user.role} — ${res.user.email}).`
        );
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan saat mengganti sesi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Security"
        userName={session?.name || "Guest"}
        userStatus={session ? `${session.role} Active` : "Unauthenticated"}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          title="Security & Access Control (sec-0.2)"
          userName={session?.name || "Guest"}
          userStatus={session ? session.role : "Unauthenticated"}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Hero Banner */}
            <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-[#090a0f] p-6 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span className="font-mono tracking-wider">
                      MILESTONE 2 CYBERSECURITY • SEC-0.2
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                    Authentication, RBAC &amp; Session Console
                  </h1>
                  <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                    Server-side role enforcement (OWNER, RECIPIENT, UNAUTHENTICATED),
                    bcrypt password hashing (R01), and anti-IDOR ownership isolation (R02, R04).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/vault"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                  >
                    <span>Open My Vault</span>
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </section>

            {notice && (
              <div
                role="status"
                className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-300"
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-300"
              >
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column: Credential Login Form & Quick Switcher */}
              <div className="space-y-6 lg:col-span-5">
                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-800/60 pb-4">
                    <KeyIcon className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">
                        Verify Credentials (Bcrypt)
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Authenticate against PostgreSQL User table (R01)
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCredentialLogin} className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="login-email"
                        className="block text-xs font-medium text-zinc-200"
                      >
                        Account Email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-zinc-200"
                      >
                        Password (verified via bcrypt.compare)
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter synthetic account password..."
                        className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {loading ? "Verifying Bcrypt Hash..." : "Sign In with Password"}
                    </button>
                  </form>
                </section>

                {/* Synthetic Account Switcher */}
                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-800/60 pb-4">
                    <UsersIcon className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">
                        Synthetic RBAC Test Accounts
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Switch roles to demonstrate server-side access control
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickSwitch("owner@example.test")}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left hover:border-emerald-500/40"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">
                          Ilham Ramadhan — Primary OWNER
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400">
                          owner@example.test (Owns v-1..v-6, rec-1..rec-4)
                        </p>
                      </div>
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                        OWNER
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickSwitch("owner2@example.test")}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left hover:border-emerald-500/40"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">
                          Raka Pratama — Secondary OWNER (Anti-IDOR)
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400">
                          owner2@example.test (Owns v-owner2, rec-owner2)
                        </p>
                      </div>
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                        OWNER 2
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleQuickSwitch("sarah.connor@example.test")
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left hover:border-emerald-500/40"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">
                          Sarah Connor — Emergency RECIPIENT
                        </p>
                        <p className="font-mono text-[11px] text-zinc-400">
                          sarah.connor@example.test (Read-only on assigned v-1)
                        </p>
                      </div>
                      <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        RECIPIENT
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickSwitch("LOGOUT")}
                      className="flex w-full items-center justify-between rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-left hover:bg-rose-950/40"
                    >
                      <div>
                        <p className="font-semibold text-rose-200">
                          Clear Session — UNAUTHENTICATED
                        </p>
                        <p className="font-mono text-[11px] text-rose-300/80">
                          All protected Server Actions will reject requests
                        </p>
                      </div>
                      <span className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">
                        LOGOUT
                      </span>
                    </button>
                  </div>
                </section>
              </div>

              {/* Right Column: Current Session State & RBAC Matrix */}
              <div className="space-y-6 lg:col-span-7">
                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                  <div className="flex items-center gap-2.5 border-b border-zinc-800/60 pb-4">
                    <LockIcon className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-100">
                        Active Session Telemetry
                      </h2>
                      <p className="text-xs text-zinc-400">
                        HTTP-Only HMAC-SHA256 Signed Session Cookie
                      </p>
                    </div>
                  </div>

                  {session ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
                        <span className="text-zinc-400">Authenticated User</span>
                        <p className="mt-1 font-semibold text-zinc-100">
                          {session.name}
                        </p>
                        <p className="font-mono text-[11px] text-emerald-400">
                          {session.email}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
                        <span className="text-zinc-400">Assigned RBAC Role</span>
                        <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
                          {session.role}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          ID: {session.userId}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
                      Currently in <strong>UNAUTHENTICATED</strong> state. Server
                      Actions require a valid signed session cookie.
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
                  <h2 className="text-base font-bold text-zinc-100">
                    RBAC Authorization Matrix (sec-0.2)
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Enforced inside Server Actions before any Prisma query or mutation
                  </p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="py-2.5 pr-3">Operation / Resource</th>
                          <th className="py-2.5 px-3">OWNER</th>
                          <th className="py-2.5 px-3">RECIPIENT</th>
                          <th className="py-2.5 pl-3">UNAUTHENTICATED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        <tr>
                          <td className="py-2.5 pr-3 font-medium">
                            Read Vault (Own / Assigned)
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400">
                            ALLOW (Own Only)
                          </td>
                          <td className="py-2.5 px-3 text-cyan-400">
                            ALLOW (Assigned Only)
                          </td>
                          <td className="py-2.5 pl-3 text-rose-400">DENY</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-medium">
                            Read Other User&apos;s Vault (IDOR)
                          </td>
                          <td className="py-2.5 px-3 text-rose-400">DENY</td>
                          <td className="py-2.5 px-3 text-rose-400">DENY</td>
                          <td className="py-2.5 pl-3 text-rose-400">DENY</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-medium">
                            Create / Update / Delete Vault
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400">
                            ALLOW (Own Only)
                          </td>
                          <td className="py-2.5 px-3 text-rose-400">DENY</td>
                          <td className="py-2.5 pl-3 text-rose-400">DENY</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-medium">
                            CRUD Emergency Recipient
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400">
                            ALLOW (Own Only)
                          </td>
                          <td className="py-2.5 px-3 text-rose-400">DENY</td>
                          <td className="py-2.5 pl-3 text-rose-400">DENY</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-3 font-medium">
                            Dead Man&apos;s Switch Check-in
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400">ALLOW</td>
                          <td className="py-2.5 px-3 text-rose-400">DENY</td>
                          <td className="py-2.5 pl-3 text-rose-400">DENY</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

