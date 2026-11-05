import type { Metadata } from "next";
import RecipientsClient from "@/components/RecipientsClient";
import { getRecipientsFromDb } from "@/lib/actions/recipient-actions";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Emergency Recipients — LastKey Secure Digital Vault",
  description:
    "Manage emergency trustees and recipients linked to Dead Man's Switch vault compartments in PostgreSQL.",
};

export default async function RecipientsPage() {
  const [session, recipients] = await Promise.all([
    getCurrentSession(),
    getRecipientsFromDb(),
  ]);

  return (
    <RecipientsClient
      key={session?.userId ?? "unauthenticated"}
      initialRecipients={recipients}
      initialSession={session}
    />
  );
}
