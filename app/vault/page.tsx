import type { Metadata } from "next";
import VaultClient from "@/components/VaultClient";
import {
  getVaultsFromDb,
  getRecipientsFromDb,
} from "@/app/actions/lastkey-actions";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Vault — LastKey Secure Digital Vault",
  description:
    "Manage zero-knowledge encrypted compartments and Dead Man's Switch release rules.",
};

/**
 * VaultPage (app/vault/page.tsx)
 *
 * Server Component yang bertugas mengambil sesi aktif, data Vault, dan Recipient
 * dari PostgreSQL melalui Prisma Client di sisi server, kemudian
 * mendelegasikan interaksi client-side (state pencarian, filter status,
 * dan form modal CRUD) kepada VaultClient.
 */
export default async function VaultPage() {
  const [session, vaults, recipients] = await Promise.all([
    getCurrentSession(),
    getVaultsFromDb(),
    getRecipientsFromDb(),
  ]);

  return (
    <VaultClient
      key={session?.userId ?? "unauthenticated"}
      initialVaults={vaults}
      initialRecipients={recipients}
      initialSession={session}
    />
  );
}
