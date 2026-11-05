import type { Metadata } from "next";
import LoginClient from "@/components/LoginClient";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security & Access Control — LastKey",
  description:
    "RBAC session authentication, bcrypt credential verification, and authorization matrix for LastKey sec-0.2.",
};

export default async function LoginPage() {
  const session = await getCurrentSession();
  return <LoginClient initialSession={session} />;
}

