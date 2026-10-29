"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import VaultCard, { VaultItem } from "@/components/VaultCard";
import CheckInCard from "@/components/CheckInCard";
import SecurityOverview from "@/components/SecurityOverview";
import ActivityList from "@/components/ActivityList";
import Footer from "@/components/Footer";
import {
  VaultIcon,
  PulseIcon,
  TimerIcon,
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  LockIcon,
  ChevronRightIcon,
} from "@/components/Icons";

// Static dummy data for Vaults
const DUMMY_VAULTS: VaultItem[] = [
  {
    id: "v-1",
    name: "Important Documents",
    fileCount: "3 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 2 hours ago",
    description: "Legal papers, credentials, and identity certificates",
  },
  {
    id: "v-2",
    name: "Personal Archive",
    fileCount: "8 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated yesterday",
    description: "Private keys, personal memoirs, and digital journals",
  },
  {
    id: "v-3",
    name: "Emergency Data",
    fileCount: "2 encrypted files",
    status: "ACTIVE",
    encryptionStatus: "AES-256 GCM",
    lastUpdated: "Updated 3 days ago",
    description: "Emergency contacts, health records, and estate instructions",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [newVaultNotice, setNewVaultNotice] = useState(false);

  const handleCreateVault = () => {
    setNewVaultNotice(true);
    setTimeout(() => {
      setNewVaultNotice(false);
    }, 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-zinc-100 antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeNav}
        onSelectItem={setActiveNav}
        userName="Ilham"
        userStatus="Protected"
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 2. Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          title="Dashboard"
          userName="Ilham"
          userStatus="Protected"
        />

        {/* Dashboard Main Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* 3. Hero / Welcome Section */}
            <section
              aria-label="Welcome and status summary"
              className="relative flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/60 via-zinc-900/30 to-[#090a0f] p-6 shadow-sm sm:flex-row sm:items-center sm:p-7"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-mono tracking-wider">
                    SYSTEM PROTECTED
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                  Welcome back, Ilham
                </h1>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Your digital vault is protected and your Dead Man&apos;s
                  Switch is active.
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Zero-Knowledge Active</span>
                </div>
              </div>
            </section>

            {/* 4. Statistic Cards (4 cards) */}
            <section aria-label="Key security statistics">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Protected Vaults */}
                <StatCard
                  title="Protected Vaults"
                  value="3"
                  description="Encrypted storage"
                  icon={<VaultIcon className="h-5 w-5" />}
                  badge="AES-256"
                />

                {/* Card 2: Active Switch */}
                <StatCard
                  title="Active Switch"
                  value="1"
                  description="Currently monitoring"
                  icon={<PulseIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Running"
                />

                {/* Card 3: Next Check-in */}
                <StatCard
                  title="Next Check-in"
                  value="12 days"
                  description="Remaining"
                  icon={<TimerIcon className="h-5 w-5" />}
                  badge="Safe Window"
                />

                {/* Card 4: Security Status */}
                <StatCard
                  title="Security Status"
                  value="Protected"
                  description="All systems normal"
                  icon={<ShieldCheckIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Optimal"
                />
              </div>
            </section>

            {/* Notification Toast for New Vault (Mock Feedback) */}
            {newVaultNotice && (
              <div
                role="status"
                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  <span>
                    New Vault creation wizard preview requested (Static UI
                    mode)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewVaultNotice(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Core Grid: Left (Switch + Vaults) & Right (Security Overview + Activity) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column (Primary operations) */}
              <div className="space-y-8 lg:col-span-7 xl:col-span-8">
                {/* 6. Dead Man's Switch Card */}
                <section aria-label="Dead Man's Switch Status">
                  <div className="mb-2 flex items-center justify-end">
                    <Link
                      href="/check-in"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                    >
                      <span>Check-in Console</span>
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <CheckInCard
                    nextCheckIn="6 days 14 hours"
                    status="ACTIVE"
                    progressPercentage={78}
                    intervalLabel="30-day scheduled release window"
                  />
                </section>

                {/* 5. My Vault Section */}
                <section aria-label="My Vaults">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                        My Vaults
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Secure compartments encrypted with unique private keys
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/vault"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-sm transition-all hover:border-zinc-700 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <span>View All</span>
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleCreateVault}
                        aria-label="Create new digital vault"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-sm transition-all hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <PlusIcon className="h-4 w-4 text-emerald-400" />
                        <span> New Vault</span>
                      </button>
                    </div>
                  </div>

                  {/* Vaults Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {DUMMY_VAULTS.map((vault) => (
                      <VaultCard
                        key={vault.id}
                        vault={vault}
                        onManage={() => {
                          router.push("/vault");
                        }}
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column (Security overview & Recent activity logs) */}
              <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                {/* 7. Security Overview */}
                <section aria-label="System Security Overview">
                  <SecurityOverview />
                </section>

                {/* 8. Recent Activity */}
                <section aria-label="Recent Security Activity Log">
                  <ActivityList />
                </section>

                {/* Mini System Info Card */}
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <LockIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-medium">Heartbeat Protocol</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                    If inactivity is detected after the 6-day window, LastKey
                    will trigger 3 secondary warning emails before initial
                    key-shard release to verified recipients.
                  </p>
                </div>
              </div>
            </div>

            {/* 9. Footer */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

