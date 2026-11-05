"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import StatCard from "@/components/StatCard";
import SessionBanner from "@/components/SessionBanner";
import VaultCard, {
  VaultItem,
  MOCK_VAULT_FILES,
  MockRecipient,
} from "@/components/VaultCard";
import type { SessionUser } from "@/lib/auth";
import {
  VaultIcon,
  LockIcon,
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  SearchIcon,
  PulseIcon,
  XIcon,
  FileTextIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  UsersIcon,
} from "@/components/Icons";
import { vaultSchema } from "@/lib/validation/vault-schema";
import {
  createVaultAction,
  updateVaultAction,
  deleteVaultAction,
  addVaultFileAction,
  createRecipientAction,
} from "@/app/actions/lastkey-actions";

const CHECK_IN_INTERVAL_OPTIONS = [
  { value: "7 days", label: "7 days (Weekly heartbeat)" },
  { value: "14 days", label: "14 days (Bi-weekly heartbeat)" },
  { value: "30 days", label: "30 days (Standard 30-day release cycle)" },
];

const GRACE_PERIOD_OPTIONS = [
  { value: "24 hours", label: "24 hours (Urgent fail-safe window)" },
  { value: "48 hours", label: "48 hours (Standard grace period)" },
  { value: "72 hours", label: "72 hours (Extended emergency buffer)" },
];

interface VaultFormData {
  name: string;
  description: string;
  recipient: string;
  checkInInterval: string;
  gracePeriod: string;
  confirmation: boolean;
}

interface VaultFormErrors {
  name?: string;
  description?: string;
  recipient?: string;
  checkInInterval?: string;
  gracePeriod?: string;
  confirmation?: string;
}

const INITIAL_FORM_DATA: VaultFormData = {
  name: "",
  description: "",
  recipient: "",
  checkInInterval: "",
  gracePeriod: "",
  confirmation: false,
};

export interface VaultClientProps {
  initialVaults?: VaultItem[];
  initialRecipients?: MockRecipient[];
  initialSession?: SessionUser | null;
}

export default function VaultClient({
  initialVaults = [],
  initialRecipients = [],
  initialSession = null,
}: VaultClientProps) {
  const [vaults, setVaults] = useState<VaultItem[]>(initialVaults);
  const [recipients, setRecipients] =
    useState<MockRecipient[]>(initialRecipients);
  const [bypassClientValidation, setBypassClientValidation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "PENDING"
  >("ALL");
  const [selectedVault, setSelectedVault] = useState<VaultItem | null>(null);

  // Form & Validation State (Create Vault)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<VaultFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<VaultFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Edit / Manage Vault State inside Quick Inspect Modal
  const [isEditingVault, setIsEditingVault] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "LOCKED" | "PENDING">(
    "ACTIVE"
  );
  const [editRecipientId, setEditRecipientId] = useState("");
  const [editInterval, setEditInterval] = useState("30 days");
  const [editGracePeriod, setEditGracePeriod] = useState("48 hours");
  const [newFileName, setNewFileName] = useState("");
  const [newFileSize, setNewFileSize] = useState("1.2 MB");
  const [manageError, setManageError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  // Add Recipient Modal State
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recName, setRecName] = useState("");
  const [recRole, setRecRole] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [recError, setRecError] = useState<string | null>(null);
  const [isCreatingRec, setIsCreatingRec] = useState(false);

  const showToast = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 5000);
  };

  // Modal open/close handlers
  const handleOpenCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setServerError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormErrors({});
    setServerError(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreateModal) handleCloseCreateModal();
        if (selectedVault) setSelectedVault(null);
        if (showRecipientModal) setShowRecipientModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, selectedVault, showRecipientModal]);

  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch =
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vault.description &&
        vault.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL" || vault.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validateForm = (): boolean => {
    const result = vaultSchema.safeParse(formData);

    if (!result.success) {
      const errors: VaultFormErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof VaultFormErrors | undefined;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }

      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleInputChange = <K extends keyof VaultFormData>(
    field: K,
    value: VaultFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof VaultFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleCreateNewVault = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bypassClientValidation) {
      const isValid = validateForm();
      if (!isValid) {
        return;
      }
    } else {
      setFormErrors({});
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await createVaultAction(formData);

      if (!result.success || !result.vault) {
        if (result.fieldErrors) {
          setFormErrors(result.fieldErrors as VaultFormErrors);
        }
        setServerError(result.error || "Gagal menyimpan vault ke PostgreSQL.");
        setIsSubmitting(false);
        return;
      }

      setVaults((prev) => [result.vault!, ...prev]);
      setFormData(INITIAL_FORM_DATA);
      setFormErrors({});
      setShowCreateModal(false);
      showToast(`Vault "${result.vault.name}" saved to PostgreSQL.`);
    } catch {
      setServerError("Terjadi gangguan jaringan saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageVault = (id: string) => {
    const found = vaults.find((v) => v.id === id);
    if (found) {
      setSelectedVault(found);
      setIsEditingVault(false);
      setManageError(null);
      setEditName(found.name);
      setEditDescription(found.description || "");
      setEditStatus(found.status);
      setEditRecipientId(
        found.recipient?.id || recipients[0]?.id || "rec-1"
      );
      setEditInterval(found.checkInInterval || "30 days");
      setEditGracePeriod(found.gracePeriod || "48 hours");
      setNewFileName("");
    }
  };

  const handleUpdateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVault) return;

    setIsManaging(true);
    setManageError(null);

    try {
      const result = await updateVaultAction(selectedVault.id, {
        name: editName,
        description: editDescription,
        status: editStatus,
        recipientId: editRecipientId,
        checkInInterval: editInterval,
        gracePeriod: editGracePeriod,
      });

      if (!result.success || !result.vault) {
        setManageError(result.error || "Gagal memperbarui data vault.");
        setIsManaging(false);
        return;
      }

      setVaults((prev) =>
        prev.map((v) => (v.id === result.vault!.id ? result.vault! : v))
      );
      setSelectedVault(result.vault);
      setIsEditingVault(false);
      showToast(`Vault "${result.vault.name}" updated in PostgreSQL.`);
    } catch {
      setManageError("Gagal menghubungi server untuk memperbarui vault.");
    } finally {
      setIsManaging(false);
    }
  };

  const handleDeleteVault = async () => {
    if (!selectedVault) return;

    setIsManaging(true);
    setManageError(null);

    try {
      const targetId = selectedVault.id;
      const targetName = selectedVault.name;
      const result = await deleteVaultAction(targetId);

      if (!result.success) {
        setManageError(result.error || "Gagal menghapus vault.");
        setIsManaging(false);
        return;
      }

      setVaults((prev) => prev.filter((v) => v.id !== targetId));
      setSelectedVault(null);
      showToast(`Vault "${targetName}" deleted from PostgreSQL.`);
    } catch {
      setManageError("Gagal menghubungi server untuk menghapus vault.");
    } finally {
      setIsManaging(false);
    }
  };

  const handleAddVaultFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVault || !newFileName.trim()) return;

    setIsManaging(true);
    setManageError(null);

    try {
      const result = await addVaultFileAction(selectedVault.id, {
        name: newFileName,
        size: newFileSize,
        cipher: selectedVault.encryptionStatus,
      });

      if (!result.success || !result.vault) {
        setManageError(result.error || "Gagal menambahkan file terenkripsi.");
        setIsManaging(false);
        return;
      }

      setVaults((prev) =>
        prev.map((v) => (v.id === result.vault!.id ? result.vault! : v))
      );
      setSelectedVault(result.vault);
      setNewFileName("");
      showToast("Encrypted file added to vault in PostgreSQL.");
    } catch {
      setManageError("Gagal menambahkan file ke database.");
    } finally {
      setIsManaging(false);
    }
  };

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRec(true);
    setRecError(null);

    try {
      const result = await createRecipientAction({
        name: recName,
        role: recRole,
        email: recEmail,
      });

      if (!result.success || !result.recipient) {
        setRecError(result.error || "Gagal mendaftarkan recipient.");
        setIsCreatingRec(false);
        return;
      }

      setRecipients((prev) => [...prev, result.recipient!]);
      setRecName("");
      setRecRole("");
      setRecEmail("");
      setShowRecipientModal(false);
      showToast(
        `Recipient "${result.recipient.name}" saved to PostgreSQL.`
      );
    } catch {
      setRecError("Gagal menghubungi server database.");
    } finally {
      setIsCreatingRec(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* RBAC Session Switcher */}
      <SessionBanner session={initialSession ?? null} />

      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            aria-label="Return to Dashboard"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Digital Vault Manager
          </span>
        </div>

        {/* Quick Link to Check-in */}
        <Link
          href="/check-in"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
        >
          <PulseIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dead Man&apos;s Switch: Active</span>
          <ChevronRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Hero / Header Section */}
      <section
        aria-label="Vault Overview"
        className="relative flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/70 via-zinc-900/30 to-[#090a0f] p-6 shadow-sm sm:flex-row sm:items-center sm:p-7"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono tracking-wider">
              ZERO-KNOWLEDGE STORAGE
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Encrypted Vaults
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
            Client-side encrypted compartments protected by your master key and
            emergency release rules.
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/recipients"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <UsersIcon className="h-4 w-4 text-emerald-400" />
            <span>Manage Recipients ({recipients.length})</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setRecError(null);
              setShowRecipientModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <PlusIcon className="h-4 w-4 text-emerald-400" />
            <span>Quick Add Recipient</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <PlusIcon className="h-4 w-4" />
            <span> New Vault</span>
          </button>
        </div>
      </section>

      {/* Notification Toast */}
      {feedbackNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3.5 text-xs text-emerald-300 animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-zinc-400 hover:text-zinc-200"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Vault Statistics */}
      <section aria-label="Vault Statistics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Compartments"
            value={vaults.length.toString()}
            description="Encrypted vaults"
            icon={<VaultIcon className="h-5 w-5" />}
            badge="Configured"
          />
          <StatCard
            title="Encryption Standard"
            value="AES-256"
            description="Galois/Counter Mode"
            icon={<LockIcon className="h-5 w-5" />}
            isAccent={true}
            badge="Hardware-grade"
          />
          <StatCard
            title="Protection State"
            value="Zero-Knowledge"
            description="Keys never leave client"
            icon={<ShieldCheckIcon className="h-5 w-5" />}
            badge="Verified"
          />
          <StatCard
            title="Fail-Safe Trigger"
            value="Armed"
            description="Connected to switch"
            icon={<PulseIcon className="h-5 w-5" />}
            isAccent={true}
            badge="Monitoring"
          />
        </div>
      </section>

      {/* Search, Filter Bar and Vault Grid */}
      <section aria-label="Vault Compartments List" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vaults by name or description..."
              aria-label="Search vaults"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500/50 focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
                aria-label="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-zinc-800 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({vaults.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-zinc-800 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active ({vaults.filter((v) => v.status === "ACTIVE").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-zinc-800 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pending ({vaults.filter((v) => v.status === "PENDING").length})
            </button>
          </div>
        </div>

        {/* Vault Cards Grid */}
        {filteredVaults.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-12 text-center">
            <VaultIcon className="mx-auto h-8 w-8 text-zinc-500" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              No vaults found matching your criteria
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Try adjusting your search query or status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onManage={handleManageVault}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bottom Cross-Navigation Banner */}
      <section
        aria-label="Cross Navigation"
        className="flex flex-col items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 sm:flex-row sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <PulseIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Dead Man&apos;s Switch Heartbeat
            </h3>
            <p className="text-xs text-zinc-400">
              Keep your switch reset to prevent automated emergency shard
              release.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/check-in"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
          >
            <span>Go to Check-in</span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Modal: Manage Vault Inspection & CRUD (Update, Add File, Delete) */}
      {selectedVault && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-vault-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <VaultIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="manage-vault-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    {selectedVault.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-400">
                      {selectedVault.encryptionStatus}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {selectedVault.id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVault((prev) => !prev)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
                >
                  {isEditingVault ? "Cancel Edit" : "Edit Vault"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVault(null)}
                  aria-label="Close vault inspection"
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {manageError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300"
              >
                <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{manageError}</span>
              </div>
            )}

            {isEditingVault ? (
              <form onSubmit={handleUpdateVault} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Vault Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(
                          e.target.value as "ACTIVE" | "LOCKED" | "PENDING"
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="LOCKED">LOCKED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">
                      Recipient
                    </label>
                    <select
                      value={editRecipientId}
                      onChange={(e) => setEditRecipientId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100"
                    >
                      {recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">
                      Check-in Interval
                    </label>
                    <select
                      value={editInterval}
                      onChange={(e) => setEditInterval(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100"
                    >
                      {CHECK_IN_INTERVAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300">
                      Grace Period
                    </label>
                    <select
                      value={editGracePeriod}
                      onChange={(e) => setEditGracePeriod(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100"
                    >
                      {GRACE_PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
              <div className="mt-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  {selectedVault.description || "Secure digital container."}
                </p>

                {selectedVault.recipient && (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs">
                    <span className="text-zinc-400">Designated Recipient: </span>
                    <span className="font-semibold text-zinc-200">
                      {selectedVault.recipient.name}
                    </span>{" "}
                    <span className="text-emerald-400">
                      ({selectedVault.recipient.email})
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Encrypted Payload Contents ({selectedVault.fileCount})
                  </p>
                  <div className="mt-2 space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3 max-h-48 overflow-y-auto">
                    {(selectedVault.files && selectedVault.files.length > 0
                      ? selectedVault.files
                      : MOCK_VAULT_FILES[selectedVault.id] || []
                    ).map((file, idx) => (
                      <div
                        key={file.id || `${file.name}-${idx}`}
                        className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileTextIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="truncate font-mono text-zinc-200">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
                          <span>{file.size}</span>
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-emerald-400">
                            {file.cipher}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Encrypted File to PostgreSQL */}
                  <form
                    onSubmit={handleAddVaultFile}
                    className="mt-2.5 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Add encrypted file (e.g. backup_keys.pdf.enc)"
                      aria-label="New encrypted file name"
                      className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newFileSize}
                      onChange={(e) => setNewFileSize(e.target.value)}
                      aria-label="File size"
                      className="w-20 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isManaging || !newFileName.trim()}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      + File
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300">
                  <span className="font-semibold">
                    Zero-Knowledge Guarantee:
                  </span>{" "}
                  This vault is locally encrypted. In emergency release, only
                  authenticated Dead Man&apos;s Switch recipients can
                  reconstruct the shard keys.
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center gap-2">
                <Link
                  href={`/vault/${selectedVault.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  <span>Open Full Detail Page ({selectedVault.id})</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteVault}
                  disabled={isManaging}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                >
                  Delete Vault
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVault(null)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Trusted Recipient */}
      {showRecipientModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-recipient-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="create-recipient-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    Add Trusted Recipient
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Register an emergency key holder in PostgreSQL
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipientModal(false)}
                aria-label="Close recipient modal"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecipient} className="mt-4 space-y-4">
              {recError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300"
                >
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{recError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="rec-name"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="rec-name"
                  type="text"
                  required
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  placeholder="e.g. Nadia Vega"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-role"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Role / Designation <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="rec-role"
                  type="text"
                  required
                  value={recRole}
                  onChange={(e) => setRecRole(e.target.value)}
                  placeholder="e.g. Family Executor / Security Auditor"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-email"
                  className="block text-xs font-medium text-zinc-200"
                >
                  Verified Email (Unique){" "}
                  <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="rec-email"
                  type="email"
                  required
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="e.g. nadia@trustee-escrow.org"
                  className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRecipientModal(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRec}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {isCreatingRec ? "Saving..." : "Save Recipient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Vault with Client-Side & Server-Side Zod Validation */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-vault-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <PlusIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="create-vault-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    Create New Digital Vault
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Configure vault compartment and Dead Man&apos;s Switch
                    parameters
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                aria-label="Close modal"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreateNewVault}
              noValidate
              className="mt-5 space-y-4"
            >
              {serverError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300"
                >
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Field 1: Vault Name */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="vault-name"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Vault Name{" "}
                    <span
                      className="text-emerald-400 font-semibold"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                  <span className="text-[10px] text-zinc-500">Required</span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="vault-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g. Master Private Keys & Passphrases"
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.name)}
                    aria-describedby={
                      formErrors.name ? "vault-name-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 ${
                      formErrors.name
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/40"
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p
                    id="vault-name-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Description (Optional) */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="vault-description"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Description
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Optional (max 200 chars)
                  </span>
                </div>
                <textarea
                  id="vault-description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe the category of assets stored in this compartment..."
                  aria-invalid={Boolean(formErrors.description)}
                  aria-describedby={
                    formErrors.description
                      ? "vault-description-error"
                      : undefined
                  }
                  className={`mt-1.5 w-full rounded-xl border bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 ${
                    formErrors.description
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                      : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/40"
                  }`}
                />
                {formErrors.description && (
                  <p
                    id="vault-description-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{formErrors.description}</span>
                  </p>
                )}
              </div>

              {/* Field 3: Recipient */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="vault-recipient"
                    className="block text-xs font-medium text-zinc-200"
                  >
                    Emergency Recipient{" "}
                    <span
                      className="text-emerald-400 font-semibold"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                  <span className="text-[10px] text-zinc-500">Required</span>
                </div>
                <div className="relative mt-1.5">
                  <select
                    id="vault-recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={(e) =>
                      handleInputChange("recipient", e.target.value)
                    }
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.recipient)}
                    aria-describedby={
                      formErrors.recipient ? "vault-recipient-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 transition-colors focus:outline-none focus:ring-2 ${
                      formErrors.recipient
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/40"
                    }`}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">
                      Select a trusted recipient...
                    </option>
                    {recipients.map((rec) => (
                      <option
                        key={rec.id}
                        value={rec.id}
                        className="bg-zinc-900 text-zinc-100"
                      >
                        {rec.name} — {rec.role} ({rec.email})
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.recipient && (
                  <p
                    id="vault-recipient-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{formErrors.recipient}</span>
                  </p>
                )}
              </div>

              {/* Grid: Check-in Interval & Grace Period */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Field 4: Check-in Interval */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="vault-check-in-interval"
                      className="block text-xs font-medium text-zinc-200"
                    >
                      Check-in Interval{" "}
                      <span
                        className="text-emerald-400 font-semibold"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                  </div>
                  <div className="relative mt-1.5">
                    <select
                      id="vault-check-in-interval"
                      name="checkInInterval"
                      value={formData.checkInInterval}
                      onChange={(e) =>
                        handleInputChange("checkInInterval", e.target.value)
                      }
                      aria-required="true"
                      aria-invalid={Boolean(formErrors.checkInInterval)}
                      aria-describedby={
                        formErrors.checkInInterval
                          ? "vault-interval-error"
                          : undefined
                      }
                      className={`w-full rounded-xl border bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 transition-colors focus:outline-none focus:ring-2 ${
                        formErrors.checkInInterval
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                          : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/40"
                      }`}
                    >
                      <option value="" className="bg-zinc-900 text-zinc-500">
                        Select interval...
                      </option>
                      {CHECK_IN_INTERVAL_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-zinc-900 text-zinc-100"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.checkInInterval && (
                    <p
                      id="vault-interval-error"
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                    >
                      <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                      <span>{formErrors.checkInInterval}</span>
                    </p>
                  )}
                </div>

                {/* Field 5: Grace Period */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="vault-grace-period"
                      className="block text-xs font-medium text-zinc-200"
                    >
                      Grace Period{" "}
                      <span
                        className="text-emerald-400 font-semibold"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                  </div>
                  <div className="relative mt-1.5">
                    <select
                      id="vault-grace-period"
                      name="gracePeriod"
                      value={formData.gracePeriod}
                      onChange={(e) =>
                        handleInputChange("gracePeriod", e.target.value)
                      }
                      aria-required="true"
                      aria-invalid={Boolean(formErrors.gracePeriod)}
                      aria-describedby={
                        formErrors.gracePeriod ? "vault-grace-error" : undefined
                      }
                      className={`w-full rounded-xl border bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 transition-colors focus:outline-none focus:ring-2 ${
                        formErrors.gracePeriod
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                          : "border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/40"
                      }`}
                    >
                      <option value="" className="bg-zinc-900 text-zinc-500">
                        Select grace period...
                      </option>
                      {GRACE_PERIOD_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-zinc-900 text-zinc-100"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.gracePeriod && (
                    <p
                      id="vault-grace-error"
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                    >
                      <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                      <span>{formErrors.gracePeriod}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Security Hint */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                  <LockIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Client-Side Dead Man&apos;s Switch</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Keys are partitioned using Shamir Secret Sharing. If no
                  heartbeat occurs during the selected interval + grace window,
                  release shards are dispatched to the selected recipient.
                </p>
              </div>

              {/* Field 6: Confirmation Checkbox */}
              <div>
                <div
                  className={`flex items-start gap-3 rounded-xl border bg-zinc-900/60 p-3.5 transition-colors ${
                    formErrors.confirmation
                      ? "border-rose-500/80"
                      : "border-zinc-800"
                  }`}
                >
                  <input
                    id="vault-confirmation"
                    name="confirmation"
                    type="checkbox"
                    checked={formData.confirmation}
                    onChange={(e) =>
                      handleInputChange("confirmation", e.target.checked)
                    }
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.confirmation)}
                    aria-describedby={
                      formErrors.confirmation
                        ? "vault-confirmation-error"
                        : undefined
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-700 bg-zinc-900 text-emerald-500 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <label
                    htmlFor="vault-confirmation"
                    className="cursor-pointer text-xs leading-relaxed text-zinc-200 select-none"
                  >
                    I confirm that the vault information and emergency recipient
                    are correct.{" "}
                    <span
                      className="text-emerald-400 font-semibold"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                </div>
                {formErrors.confirmation && (
                  <p
                    id="vault-confirmation-error"
                    role="alert"
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{formErrors.confirmation}</span>
                  </p>
                )}
              </div>

              {/* Server Validation Test Mode Toggle */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5 text-[11px] text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="bypass-client-validation"
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

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-60"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>{isSubmitting ? "Saving..." : "Create Vault"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
