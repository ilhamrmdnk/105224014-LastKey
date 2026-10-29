import React from "react";
import { ShieldCheckIcon } from "@/components/Icons";

/**
 * VaultTemplate (app/vault/template.tsx)
 *
 * Berbeda dengan layout.tsx yang bersifat persisten dan mempertahankan state
 * saat berpindah antar sub-route (/vault -> /vault/v-1 -> /vault/v-2),
 * template.tsx akan di-remount (membuat instance DOM/komponen baru) setiap kali
 * pengguna melakukan navigasi ke route baru di dalam segmen /vault.
 */
export default function VaultTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 transition-opacity duration-200">
      {/* Subtle Vault Route Session Banner (Remounted per navigation via template.tsx) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/30 px-4 py-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-zinc-300">
            VAULT_TEMPLATE_INSTANCE
          </span>
          <span className="hidden text-zinc-600 sm:inline">•</span>
          <span className="hidden sm:inline">
            Fresh route boundary mounted on navigation
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Session Verified
          </span>
        </div>
      </div>

      {/* Route Segment Content */}
      {children}
    </div>
  );
}

