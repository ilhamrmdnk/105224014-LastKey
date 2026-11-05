"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  LockIcon,
  UsersIcon,
  AlertTriangleIcon,
} from "@/components/Icons";
import {
  switchDemoAccountAction,
  logoutAction,
} from "@/lib/actions/auth-actions";
import type { SessionUser } from "@/lib/auth";

export interface SessionBannerProps {
  session: SessionUser | null;
  onSessionChanged?: () => void;
}

export default function SessionBanner({
  session,
  onSessionChanged,
}: SessionBannerProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSwitch = async (
    target:
      | "owner@example.test"
      | "owner2@example.test"
      | "sarah.connor@example.test"
      | "LOGOUT"
  ) => {
    setLoadingRole(target);
    setErrorMsg(null);
    try {
      if (target === "LOGOUT") {
        await logoutAction();
      } else {
        const res = await switchDemoAccountAction(target);
        if (!res.success) {
          setErrorMsg(res.error || "Gagal mengganti sesi.");
          setLoadingRole(null);
          return;
        }
      }
      if (onSessionChanged) {
        onSessionChanged();
      }
      router.refresh();
    } catch {
      setErrorMsg("Gagal menghubungi server autentikasi.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      aria-label="RBAC Session Control Bar"
      className={`rounded-xl border p-3.5 text-xs transition-colors ${
        session
          ? "border-emerald-500/25 bg-zinc-900/70 text-zinc-200"
          : "border-amber-500/40 bg-amber-950/20 text-amber-200"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              session
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {session ? (
              <ShieldCheckIcon className="h-4 w-4" />
            ) : (
              <AlertTriangleIcon className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                RBAC Session (sec-0.2):
              </span>
              {session ? (
                <>
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300">
                    {session.role}
                  </span>
                  <span className="font-semibold text-zinc-100">
                    {session.name}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    ({session.email})
                  </span>
                </>
              ) : (
                <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                  UNAUTHENTICATED (No Active Session)
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {session
                ? session.role === "OWNER"
                  ? "Full CRUD access limited strictly to your own Vaults and Recipients (Anti-IDOR enforced)."
                  : "Read-only access limited strictly to Vault compartments assigned to your verified email."
                : "Protected PostgreSQL queries and mutations are blocked by server-side RBAC until you authenticate."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleSwitch("owner@example.test")}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              session?.email === "owner@example.test"
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {loadingRole === "owner@example.test"
              ? "Signing in..."
              : "Owner 1 (Ilham)"}
          </button>

          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleSwitch("owner2@example.test")}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              session?.email === "owner2@example.test"
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {loadingRole === "owner2@example.test"
              ? "Signing in..."
              : "Owner 2 (Raka)"}
          </button>

          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleSwitch("sarah.connor@example.test")}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              session?.email === "sarah.connor@example.test"
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {loadingRole === "sarah.connor@example.test"
              ? "Signing in..."
              : "Recipient (Sarah)"}
          </button>

          {session && (
            <button
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleSwitch("LOGOUT")}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20"
            >
              {loadingRole === "LOGOUT" ? "Logging out..." : "Logout"}
            </button>
          )}

          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
          >
            <LockIcon className="h-3 w-3 text-emerald-400" />
            <span>Auth Console</span>
          </Link>
          <Link
            href="/recipients"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
          >
            <UsersIcon className="h-3 w-3 text-emerald-400" />
            <span>Recipients</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <p role="alert" className="mt-2 text-xs text-rose-400">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

