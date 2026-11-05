"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import SessionBanner from "@/components/SessionBanner";
import Footer from "@/components/Footer";
import {
  UsersIcon,
  VaultIcon,
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
  ChevronRightIcon,
  LockIcon,
} from "@/components/Icons";
import { recipientSchema } from "@/lib/validation/recipient-schema";
import {
  createRecipientAction,
  updateRecipientAction,
  deleteRecipientAction,
  type RecipientWithVaults,
} from "@/lib/actions/recipient-actions";
import type { SessionUser } from "@/lib/auth";

export interface RecipientsClientProps {
  initialRecipients: RecipientWithVaults[];
  initialSession: SessionUser | null;
}

interface RecipientFieldErrors {
  name?: string;
  role?: string;
  email?: string;
}

export default function RecipientsClient({
  initialRecipients,
  initialSession,
}: RecipientsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recipients, setRecipients] =
    useState<RecipientWithVaults[]>(initialRecipients);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createFieldErrors, setCreateFieldErrors] =
    useState<RecipientFieldErrors>({});
  const [createServerError, setCreateServerError] = useState<string | null>(
    null
  );
  const [bypassClientValidation, setBypassClientValidation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit / Detail Modal State
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientWithVaults | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<RecipientFieldErrors>(
    {}
  );
  const [manageError, setManageError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  // Toast Feedback
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 5000);
  };

  const handleOpenCreate = () => {
    setCreateName("");
    setCreateRole("");
    setCreateEmail("");
    setCreateFieldErrors({});
    setCreateServerError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFieldErrors({});
    setCreateServerError(null);

    if (!bypassClientValidation) {
      const parsed = recipientSchema.safeParse({
        name: createName,
        role: createRole,
        email: createEmail,
      });
      if (!parsed.success) {
        const errs: RecipientFieldErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof RecipientFieldErrors | undefined;
          if (field && !errs[field]) {
            errs[field] = issue.message;
          }
        }
        setCreateFieldErrors(errs);
        return;
      }
    }

    setIsCreating(true);
    try {
      const result = await createRecipientAction({
        name: createName,
        role: createRole,
        email: createEmail,
      });

      if (!result.success || !result.recipient) {
        if (result.fieldErrors) {
          setCreateFieldErrors(result.fieldErrors as RecipientFieldErrors);
        }
        setCreateServerError(
          result.error || "Gagal menyimpan recipient ke PostgreSQL."
        );
        setIsCreating(false);
        return;
      }

      setRecipients((prev) => [...prev, result.recipient!]);
      setShowCreateModal(false);
      showToast(
        `Recipient "${result.recipient.name}" (${result.recipient.email}) berhasil disimpan ke PostgreSQL.`
      );
    } catch {
      setCreateServerError("Gagal menghubungi server database.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectRecipient = (rec: RecipientWithVaults, startEdit = false) => {
    setSelectedRecipient(rec);
    setIsEditing(startEdit);
    setEditName(rec.name);
    setEditRole(rec.role);
    setEditEmail(rec.email);
    setEditFieldErrors({});
    setManageError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) return;

    setEditFieldErrors({});
    setManageError(null);
    setIsManaging(true);

    try {
      const result = await updateRecipientAction(selectedRecipient.id, {
        name: editName,
        role: editRole,
        email: editEmail,
      });

      if (!result.success || !result.recipient) {
        if (result.fieldErrors) {
          setEditFieldErrors(result.fieldErrors as RecipientFieldErrors);
        }
        setManageError(result.error || "Gagal memperbarui data recipient.");
        setIsManaging(false);
        return;
      }

      setRecipients((prev) =>
        prev.map((r) => (r.id === result.recipient!.id ? result.recipient! : r))
      );
      setSelectedRecipient(result.recipient);
      setIsEditing(false);
      showToast(
        `Recipient "${result.recipient.name}" berhasil diperbarui di PostgreSQL.`
      );
    } catch {
      setManageError("Gagal menghubungi server untuk memperbarui recipient.");
    } finally {
      setIsManaging(false);
    }
  };

  const handleDeleteRecipient = async (rec: RecipientWithVaults) => {
    setIsManaging(true);
    setManageError(null);
    setPageError(null);

    try {
      const result = await deleteRecipientAction(rec.id);
      if (!result.success) {
        const errMsg = result.error || "Gagal menghapus recipient.";
        if (selectedRecipient?.id === rec.id) {
          setManageError(errMsg);
        } else {
          setPageError(errMsg);
        }
        setIsManaging(false);
        return;
      }

      setRecipients((prev) => prev.filter((r) => r.id !== rec.id));
      if (selectedRecipient?.id === rec.id) {
        setSelectedRecipient(null);
      }
      showToast(
        `Recipient "${rec.name}" (${rec.email}) telah dihapus dari PostgreSQL.`
      );
    } catch {
      setManageError("Gagal menghubungi server untuk menghapus recipient.");
    } finally {
      setIsManaging(false);
    }
  };

  const totalLinkedVaults = recipients.reduce(
    (acc, r) => acc + (r.vaults?.length ?? 0),
    0
  );
  const unassignedCount = recipients.filter(
    (r) => !r.vaults || r.vaults.length === 0
  ).length;

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Recipients"
        userName={initialSession?.name || "Guest"}
        userStatus={
          initialSession ? `${initialSession.role} Active` : "Unauthenticated"
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          title="Emergency Recipients"
          userName={initialSession?.name || "Guest"}
          userStatus={initialSession ? initialSession.role : "Unauthenticated"}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* RBAC Session Switcher */}
            <SessionBanner
              session={initialSession}
              onSessionChanged={() => window.location.reload()}
            />

            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/vault"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-emerald-300"
                >
                  <span aria-hidden="true">&larr;</span>
                  <span>Back to My Vault</span>
                </Link>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  Emergency Trustee &amp; Recipient Directory
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
              >
                <PlusIcon className="h-4 w-4" />
                <span>New Recipient</span>
              </button>
            </div>

            {/* Hero Header */}
            <section className="relative flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/70 via-zinc-900/30 to-[#090a0f] p-6 shadow-sm sm:flex-row sm:items-center sm:p-7">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-mono tracking-wider">
                    TRUSTED EMERGENCY RECIPIENTS (1-TO-MANY VAULT RELATION)
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                  Emergency Recipients Management
                </h1>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Register, update, and verify emergency key holders assigned to
                  your Dead Man&apos;s Switch compartments in PostgreSQL.
                </p>
              </div>
            </section>

            {/* Feedback & Page Errors */}
            {feedbackNotice && (
              <div
                role="status"
                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3.5 text-xs text-emerald-300"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="font-medium">{feedbackNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackNotice(null)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {pageError && (
              <div
                role="alert"
                className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3.5 text-xs text-rose-300"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                  <span className="font-medium">{pageError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPageError(null)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Key Statistics */}
            <section aria-label="Recipient Statistics">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Registered Recipients"
                  value={recipients.length.toString()}
                  description="Stored in PostgreSQL"
                  icon={<UsersIcon className="h-5 w-5" />}
                  badge="Verified"
                />
                <StatCard
                  title="Linked Compartments"
                  value={totalLinkedVaults.toString()}
                  description="Active foreign key links"
                  icon={<VaultIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="ON DELETE RESTRICT"
                />
                <StatCard
                  title="Unassigned Trustees"
                  value={unassignedCount.toString()}
                  description="Ready for assignment or removal"
                  icon={<ShieldCheckIcon className="h-5 w-5" />}
                  badge="Standby"
                />
                <StatCard
                  title="Access Control"
                  value={initialSession?.role || "LOCKED"}
                  description="R04 Spoofing Mitigation"
                  icon={<LockIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Server-Side"
                />
              </div>
            </section>

            {/* Recipients Grid */}
            <section aria-label="Recipients Directory" className="space-y-4">
              {recipients.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-10 text-center">
                  <UsersIcon className="mx-auto h-8 w-8 text-zinc-500" />
                  <p className="mt-3 text-sm font-semibold text-zinc-200">
                    {initialSession?.role === "OWNER"
                      ? "Belum ada Recipient yang terdaftar"
                      : "Daftar Recipient hanya dapat diakses oleh peran OWNER (Mitigasi R04)"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {initialSession?.role === "OWNER"
                      ? "Tambahkan penerima darurat baru untuk mulai mengaitkan dengan Vault."
                      : "Gunakan tombol Owner 1 (Ilham) pada bilah RBAC di atas untuk mengelola Recipient."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recipients.map((rec) => {
                    const linkedVaults = rec.vaults ?? [];
                    return (
                      <div
                        key={rec.id}
                        className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/60"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
                                {rec.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h2 className="text-base font-semibold text-zinc-100">
                                  {rec.name}
                                </h2>
                                <p className="text-xs font-medium text-emerald-400">
                                  {rec.role}
                                </p>
                              </div>
                            </div>
                            <span className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                              {rec.id}
                            </span>
                          </div>

                          <div className="mt-4 rounded-lg border border-zinc-800/70 bg-zinc-950/50 px-3 py-2 font-mono text-xs text-zinc-300">
                            {rec.email}
                          </div>

                          {/* Linked Vaults (Relasi 1-to-Many) */}
                          <div className="mt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                              Assigned Vaults ({linkedVaults.length})
                            </p>
                            {linkedVaults.length === 0 ? (
                              <p className="mt-1.5 text-xs text-zinc-500 italic">
                                Not assigned to any Vault compartment
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {linkedVaults.map((v) => (
                                  <Link
                                    key={v.id}
                                    href={`/vault/${v.id}`}
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20"
                                  >
                                    <span className="font-mono font-bold">
                                      {v.id}
                                    </span>
                                    <span>• {v.name}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleSelectRecipient(rec, false)}
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectRecipient(rec, true)}
                            className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isManaging}
                            onClick={() => handleDeleteRecipient(rec)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Footer />
          </div>
        </main>
      </div>

      {/* Modal: Create New Recipient */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-rec-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <PlusIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="create-rec-modal-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    Create Emergency Recipient
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Validated with Zod 4 on Server Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              noValidate
              className="mt-4 space-y-4"
            >
              {createServerError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300"
                >
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{createServerError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="new-rec-name"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="new-rec-name"
                  type="text"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    setCreateFieldErrors((prev) => ({
                      ...prev,
                      name: undefined,
                    }));
                  }}
                  placeholder="e.g. Dr. Arman Wijaya"
                  aria-invalid={Boolean(createFieldErrors.name)}
                  className={`mt-1.5 w-full rounded-xl border bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none ${
                    createFieldErrors.name
                      ? "border-rose-500/80"
                      : "border-zinc-800 focus:border-emerald-500/50"
                  }`}
                />
                {createFieldErrors.name && (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{createFieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="new-rec-role"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Role / Designation <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="new-rec-role"
                  type="text"
                  value={createRole}
                  onChange={(e) => {
                    setCreateRole(e.target.value);
                    setCreateFieldErrors((prev) => ({
                      ...prev,
                      role: undefined,
                    }));
                  }}
                  placeholder="e.g. Estate Notary"
                  aria-invalid={Boolean(createFieldErrors.role)}
                  className={`mt-1.5 w-full rounded-xl border bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none ${
                    createFieldErrors.role
                      ? "border-rose-500/80"
                      : "border-zinc-800 focus:border-emerald-500/50"
                  }`}
                />
                {createFieldErrors.role && (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{createFieldErrors.role}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="new-rec-email"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Verified Email <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="new-rec-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => {
                    setCreateEmail(e.target.value);
                    setCreateFieldErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }}
                  placeholder="e.g. arman.wijaya@example.test"
                  aria-invalid={Boolean(createFieldErrors.email)}
                  className={`mt-1.5 w-full rounded-xl border bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:outline-none ${
                    createFieldErrors.email
                      ? "border-rose-500/80"
                      : "border-zinc-800 focus:border-emerald-500/50"
                  }`}
                />
                {createFieldErrors.email && (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{createFieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5 text-[11px] text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bypassClientValidation}
                    onChange={(e) =>
                      setBypassClientValidation(e.target.checked)
                    }
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  <span>
                    Bypass Client Validation (kirim langsung ke Server Action
                    untuk menguji penolakan Zod Server)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {isCreating ? "Saving..." : "Save Recipient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspect & Edit Recipient */}
      {selectedRecipient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-rec-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400">
                  {selectedRecipient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3
                    id="manage-rec-modal-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    {selectedRecipient.name}
                  </h3>
                  <p className="font-mono text-[11px] text-zinc-400">
                    ID: {selectedRecipient.id} • {selectedRecipient.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
                >
                  {isEditing ? "Cancel Edit" : "Edit Recipient"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecipient(null)}
                  aria-label="Close modal"
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {manageError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300"
              >
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{manageError}</span>
              </div>
            )}

            {isEditing ? (
              <form
                onSubmit={handleUpdateSubmit}
                noValidate
                className="mt-4 space-y-4"
              >
                <div>
                  <label
                    htmlFor="edit-rec-name"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Full Name
                  </label>
                  <input
                    id="edit-rec-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                  />
                  {editFieldErrors.name && (
                    <p role="alert" className="mt-1 text-xs text-rose-400">
                      {editFieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-rec-role"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Role / Designation
                  </label>
                  <input
                    id="edit-rec-role"
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                  />
                  {editFieldErrors.role && (
                    <p role="alert" className="mt-1 text-xs text-rose-400">
                      {editFieldErrors.role}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-rec-email"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Verified Email
                  </label>
                  <input
                    id="edit-rec-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                  />
                  {editFieldErrors.email && (
                    <p role="alert" className="mt-1 text-xs text-rose-400">
                      {editFieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isManaging}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {isManaging ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                  <div>
                    <span className="text-zinc-400">Designation</span>
                    <p className="mt-0.5 font-semibold text-emerald-400">
                      {selectedRecipient.role}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Verified Email</span>
                    <p className="mt-0.5 font-mono text-zinc-200">
                      {selectedRecipient.email}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold uppercase tracking-wider text-zinc-400">
                    Linked Vault Compartments (
                    {selectedRecipient.vaults?.length ?? 0})
                  </p>
                  {selectedRecipient.vaults &&
                  selectedRecipient.vaults.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {selectedRecipient.vaults.map((v) => (
                        <Link
                          key={v.id}
                          href={`/vault/${v.id}`}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 hover:border-emerald-500/40"
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-emerald-300">
                              {v.id}
                            </span>
                            <span className="font-medium text-zinc-100">
                              {v.name}
                            </span>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-zinc-500">
                      Recipient ini belum ditugaskan ke Vault mana pun dan dapat
                      dihapus dengan aman.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
              <button
                type="button"
                disabled={isManaging}
                onClick={() => handleDeleteRecipient(selectedRecipient)}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
              >
                Delete Recipient
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecipient(null)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

