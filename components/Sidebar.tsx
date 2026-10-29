"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  KeyIcon,
  LayoutDashboardIcon,
  VaultIcon,
  UsersIcon,
  PulseIcon,
  ShieldCheckIcon,
  FileTextIcon,
  XIcon,
} from "./Icons";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeItem?: string;
  onSelectItem?: (item: string) => void;
  userName?: string;
  userStatus?: string;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboardIcon, href: "/" },
  { name: "My Vault", icon: VaultIcon, href: "/vault" },
  { name: "Recipients", icon: UsersIcon },
  { name: "Check-in", icon: PulseIcon, href: "/check-in" },
  { name: "Security", icon: ShieldCheckIcon },
  { name: "About", icon: FileTextIcon, href: "/about" },
];

export function Sidebar({
  isOpen = false,
  onClose,
  activeItem = "Dashboard",
  onSelectItem,
  userName = "Ilham",
  userStatus = "Protected",
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const effectiveOpen = isOpen || internalOpen;

  useEffect(() => {
    const handleToggle = () => {
      setInternalOpen((prev) => !prev);
    };
    window.addEventListener("lastkey:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("lastkey:toggle-sidebar", handleToggle);
  }, []);

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleItemClick = (name: string) => {
    if (onSelectItem) {
      onSelectItem(name);
    }
    handleClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {effectiveOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs transition-opacity md:hidden cursor-pointer"
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              handleClose();
            }
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-zinc-800/80 bg-[#0b0d14] p-5 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          effectiveOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar navigation"
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
            <Link
              href="/"
              onClick={() => {
                if (onSelectItem) onSelectItem("Dashboard");
                handleClose();
              }}
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                <KeyIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-base font-bold tracking-wider text-zinc-100 group-hover:text-emerald-300 transition-colors">
                  LASTKEY
                </span>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Secure Digital Vault
                </p>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:text-zinc-200 md:hidden"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-6 space-y-1.5" aria-label="Main Navigation">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.name;

              const innerContent = (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? "text-emerald-400"
                          : "text-zinc-400 group-hover:text-zinc-300"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </>
              );

              const itemClassName = `group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
              }`;

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => handleItemClick(item.name)}
                    aria-current={isActive ? "page" : undefined}
                    className={itemClassName}
                  >
                    {innerContent}
                  </Link>
                );
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.name)}
                  aria-current={isActive ? "page" : undefined}
                  className={itemClassName}
                >
                  {innerContent}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Profile */}
        <div className="border-t border-zinc-800/60 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-800 font-mono text-xs font-bold text-zinc-200">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-200">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-400">
                    {userStatus}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="flex h-6 w-6 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              title="Protected System"
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
