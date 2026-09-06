import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

const META: Record<AttendanceStatus, { label: string; className: string }> = {
  present: {
    label: "حاضر",
    className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  absent: {
    label: "غائب",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  late: {
    label: "متأخر",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  excused: {
    label: "بعذر",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: META.present.label,
  absent: META.absent.label,
  late: META.late.label,
  excused: META.excused.label,
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
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
