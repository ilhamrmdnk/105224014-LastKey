import React from "react";
import {
  VaultIcon,
  LockIcon,
  PulseIcon,
  UsersIcon,
  TimerIcon,
} from "./Icons";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "vault" | "file" | "checkin" | "recipient";
}

export interface ActivityListProps {
  activities?: ActivityItem[];
}

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Vault created",
    description: "Important Documents vault was created",
    timestamp: "2 hours ago",
    type: "vault",
  },
  {
    id: "act-2",
    title: "File encrypted",
    description: "document.pdf was encrypted",
    timestamp: "Yesterday",
    type: "file",
  },
  {
    id: "act-3",
    title: "Check-in completed",
    description: "Dead Man's Switch timer was reset",
    timestamp: "3 days ago",
    type: "checkin",
  },
  {
    id: "act-4",
    title: "Recipient updated",
    description: "Trusted recipient information was updated",
    timestamp: "5 days ago",
    type: "recipient",
  },
];

export function ActivityList({
  activities = DEFAULT_ACTIVITIES,
}: ActivityListProps) {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "vault":
        return <VaultIcon className="h-3.5 w-3.5 text-zinc-300" />;
      case "file":
        return <LockIcon className="h-3.5 w-3.5 text-emerald-400" />;
      case "checkin":
        return <PulseIcon className="h-3.5 w-3.5 text-emerald-400" />;
      case "recipient":
        return <UsersIcon className="h-3.5 w-3.5 text-zinc-300" />;
      default:
        return <TimerIcon className="h-3.5 w-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <h3 className="text-sm font-semibold text-zinc-100">Recent Activity</h3>
        <span className="text-[11px] text-zinc-400">Live Log</span>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-4 space-y-4">
        {activities.map((item, index) => (
          <div key={item.id} className="relative flex items-start gap-3">
            {/* Timeline connector line */}
            {index !== activities.length - 1 && (
              <span
                className="absolute left-3.5 top-7 -bottom-4 w-px bg-zinc-800/80"
                aria-hidden="true"
              />
            )}

            {/* Icon Node */}
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-800/80 shadow-sm">
              {getIcon(item.type)}
            </div>

            {/* Activity Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-200">
                  {item.title}
                </p>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {item.timestamp}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400 truncate">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityList;
