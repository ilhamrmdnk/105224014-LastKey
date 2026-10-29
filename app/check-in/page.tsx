"use client";

import React, { useState } from "react";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import CheckInCard from "@/components/CheckInCard";
import Footer from "@/components/Footer";
import {
  PulseIcon,
  ShieldCheckIcon,
  TimerIcon,
  VaultIcon,
  UsersIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  LockIcon,
} from "@/components/Icons";

export default function CheckInPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Check-in");

  // Mock State for Dead Man's Switch Demo
  const [nextCheckIn, setNextCheckIn] = useState("6 days 14 hours");
  const [switchStatus, setSwitchStatus] = useState("ACTIVE");
  const [progressPercentage, setProgressPercentage] = useState(80);
  const [lastCheckInTime, setLastCheckInTime] = useState("3 days ago (11:24 UTC)");
  const [showCheckInToast, setShowCheckInToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleDemoCheckIn = () => {
    setNextCheckIn("30 days 00 hours");
    setProgressPercentage(100);
    setSwitchStatus("ACTIVE");
    setLastCheckInTime("Just now (Heartbeat verified)");
    setToastMessage(
      "Proof-of-life heartbeat acknowledged! Switch timer successfully reset to 30 days (Demo Mode)."
    );
    setShowCheckInToast(true);
    setTimeout(() => {
      setShowCheckInToast(false);
    }, 5000);
  };

  const handleResetDemoState = () => {
    setNextCheckIn("6 days 14 hours");
    setProgressPercentage(78);
    setSwitchStatus("ACTIVE");
    setLastCheckInTime("3 days ago (11:24 UTC)");
    setShowCheckInToast(false);
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
          title="Check-in"
          userName="Ilham"
          userStatus="Protected"
        />

        {/* Check-in Main Container */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
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
                  Dead Man&apos;s Switch Console
                </span>
              </div>

              {/* Navigation to My Vault */}
              <Link
                href="/vault"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-emerald-300"
              >
                <VaultIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>View My Vaults</span>
                <ChevronRightIcon className="h-3 w-3 text-zinc-400" />
              </Link>
            </div>

            {/* Hero / Header Section */}
            <section
              aria-label="Dead Man's Switch Overview"
              className="relative flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/70 via-zinc-900/30 to-[#090a0f] p-6 shadow-sm sm:flex-row sm:items-center sm:p-7"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-mono tracking-wider">
                    DEAD MAN&apos;S SWITCH ARMED &amp; MONITORING
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                  Heartbeat &amp; Check-in Console
                </h1>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Periodically confirm your presence to defer automated emergency vault key release.
                </p>
              </div>

              {/* Quick Status Pill & Demo Reset */}
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetDemoState}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                  title="Reset countdown demo to 6 days remaining"
                >
                  Reset Demo Timer
                </button>
              </div>
            </section>

            {/* Notification Toast */}
            {showCheckInToast && (
              <div
                role="status"
                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3.5 text-xs text-emerald-300 animate-fadeIn"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="font-medium">{toastMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckInToast(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Core Section: CheckInCard & Live Switch Telemetry */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column: Reused CheckInCard */}
              <div className="space-y-6 lg:col-span-7 xl:col-span-8">
                <section aria-label="Check-in Controller">
                  <CheckInCard
                    nextCheckIn={nextCheckIn}
                    status={switchStatus}
                    progressPercentage={progressPercentage}
                    intervalLabel="30-day scheduled release window"
                    onCheckIn={handleDemoCheckIn}
                  />
                </section>

                {/* Switch Telemetry Details */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
                  <h3 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800/60 pb-3">
                    Switch Heartbeat Telemetry (Demo)
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Last Confirmed Check-in
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-zinc-200">
                        {lastCheckInTime}
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-400">
                        ● Hardware Security Token Verified
                      </p>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Next Automated Ping
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-zinc-200">
                        In 4 days (Email / Authenticator)
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        3 escalation alerts before grace period
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Switch Protocol Lifecycle & Safeguards */}
              <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                {/* Protocol Pipeline Information */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
                  <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Fail-Safe Release Pipeline
                    </h3>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Stage 1 */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          Active Monitoring Window
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                          Normal operation. User has 30 days to check in. Vaults remain strictly locked.
                        </p>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/20 text-xs font-bold text-yellow-400">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          7-Day Grace &amp; Alert Escalation
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                          If window expires, 3 urgent alerts are dispatched via PGP email, SMS, and backup channels.
                        </p>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20 text-xs font-bold text-red-400">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          Emergency Shard Release
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                          Zero-knowledge Shamir key shards are transmitted to designated trusted recipients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Warning Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <AlertTriangleIcon className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">Demo Mode Notice</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                    This is an interactive simulation of LastKey&apos;s Dead Man&apos;s Switch. Clicking &quot;CHECK IN NOW&quot; updates client state to demonstrate heartbeat confirmation without triggering backend tasks.
                  </p>
                </div>
              </div>
            </div>

            {/* Switch Configuration Statistics */}
            <section aria-label="Dead Man's Switch Specifications">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Heartbeat Interval"
                  value="30 Days"
                  description="Scheduled cycle"
                  icon={<TimerIcon className="h-5 w-5" />}
                  badge="Configured"
                />
                <StatCard
                  title="Grace Period"
                  value="7 Days"
                  description="3 warning alerts"
                  icon={<PulseIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Safety Net"
                />
                <StatCard
                  title="Recipients Configured"
                  value="2 Trusted"
                  description="Shamir split-key shards"
                  icon={<UsersIcon className="h-5 w-5" />}
                  badge="Verified"
                />
                <StatCard
                  title="Cipher Protocol"
                  value="AES-256 GCM"
                  description="Zero-knowledge release"
                  icon={<LockIcon className="h-5 w-5" />}
                  isAccent={true}
                  badge="Tamper-proof"
                />
              </div>
            </section>

            {/* Bottom Cross-Navigation Banner */}
            <section
              aria-label="Cross Navigation"
              className="flex flex-col items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 sm:flex-row sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <VaultIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Protected Vault Compartments
                  </h3>
                  <p className="text-xs text-zinc-400">
                    View and manage encrypted items governed by this switch.
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
                  href="/vault"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
                >
                  <span>Open My Vault</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            {/* 3. Footer */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

