"use client";

import React from "react";
import Link from "next/link";
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
} from "./Icons";

export interface NavbarProps {
  onToggleSidebar?: () => void;
  title?: string;
  userName?: string;
  userStatus?: string;
}

export function Navbar({
  onToggleSidebar,
  title = "Dashboard",
  userName = "Ilham",
}: NavbarProps) {
  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lastkey:toggle-sidebar"));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-[#090a0f]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Menu Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Open sidebar menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/" className="transition-colors hover:text-emerald-400">
              LastKey
            </Link>
            <span className="text-zinc-600">/</span>
          </nav>
          <h1 className="text-sm font-semibold text-zinc-100 sm:text-base">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Mock Button */}
        <button
          type="button"
          aria-label="Search digital vault"
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <SearchIcon className="h-4 w-4 text-zinc-400" />
          <span className="hidden sm:inline">Search vault...</span>
          <kbd className="hidden sm:inline rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <BellIcon className="h-4 w-4" />
          {/* Subtle notification dot */}
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#090a0f]" />
        </button>

        {/* User Avatar Capsule */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-800 font-mono text-xs font-semibold text-zinc-200 shadow-sm">
            {userName.charAt(0).toUpperCase()}
            {/* Status dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#090a0f]"
              title="Protected"
            />
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-xs font-medium text-zinc-200 leading-none">
              {userName}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium leading-none mt-1">
              Protected
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
