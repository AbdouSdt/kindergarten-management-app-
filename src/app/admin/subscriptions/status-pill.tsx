import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
type SubscriptionCycle = Database["public"]["Enums"]["subscription_cycle"];

const META: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: {
    label: "نشط",
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  overdue: {
    label: "متأخر",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  paused: {
    label: "موقوف",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  cancelled: {
    label: "ملغى",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
  },
};

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: META.active.label,
  overdue: META.overdue.label,
  paused: META.paused.label,
  cancelled: META.cancelled.label,
};

export const CYCLE_LABEL: Record<SubscriptionCycle, string> = {
  monthly: "شهري",
  termly: "فصلي",
  annual: "سنوي",
};

export function StatusPill({ status }: { status: SubscriptionStatus }) {
  const meta = META[status] ?? { label: status, className: "bg-muted" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
