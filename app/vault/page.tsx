import type { Metadata } from "next";
import VaultClient from "@/components/VaultClient";
import { INITIAL_VAULTS } from "@/components/VaultCard";

export const metadata: Metadata = {
  title: "My Vault — LastKey Secure Digital Vault",
  description:
    "Manage zero-knowledge encrypted compartments and Dead Man's Switch release rules.",
};

/**
 * VaultPage (app/vault/page.tsx)
 *
 * Server Component yang bertugas menyediakan metadata rute dan data awal
 * vault dari sisi server, kemudian mendelegasikan interaksi client-side
 * (state pencarian, filter status, dan form modal) kepada VaultClient.
 */
export default function VaultPage() {
  return <VaultClient initialVaults={INITIAL_VAULTS} />;
}
