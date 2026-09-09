import { cn } from "@/lib/utils";

/**
 * Panel rendered in place of a table or list when there is nothing to show:
 * either no rows yet (`tone="muted"`, the default) or a failed query
 * (`tone="error"`). Keeps the app from showing a silently blank area.
 */
export function EmptyState({
  title,
  description,
  tone = "muted",
  className,
}: {
  title: string;
  description?: string;
  tone?: "muted" | "error";
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "border-border rounded-lg border border-dashed p-8 text-center",
        className,
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          tone === "error" ? "text-red-600" : "text-foreground",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      ) : null}
    </div>
  );
}

/** Standard Arabic copy for a failed data load. */
export const LOAD_ERROR_TITLE = "تعذّر تحميل البيانات";
export const LOAD_ERROR_HINT = "حدث خطأ أثناء جلب البيانات. حدّث الصفحة أو حاول لاحقاً.";
