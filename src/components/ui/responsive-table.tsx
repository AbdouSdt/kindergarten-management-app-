import { cn } from "@/lib/utils";

export type ResponsiveColumn<T> = {
  /** Stable key for the column. */
  key: string;
  /** Header text — also used as the field label in card mode. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  /**
   * When `false`, the cell is rendered full-width with no label in card mode
   * (use for a row-actions cell). Defaults to labelled.
   */
  labelled?: boolean;
  /** Extra classes for the `<td>` in table mode. */
  className?: string;
};

/**
 * One dataset, two presentations: a real `<table>` from `md` up (kept inside a
 * horizontally scrollable, visibly-bordered container) and a stack of labelled
 * cards below `md`. Presentation only — the caller still does the query.
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: ResponsiveColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  const labelled = columns.filter((c) => c.labelled !== false);
  const unlabelled = columns.filter((c) => c.labelled === false);

  return (
    <>
      <div className="border-border hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 text-start font-medium">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-border border-t align-top">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="border-border bg-card rounded-lg border p-4 shadow-sm"
          >
            <dl className="space-y-2 text-sm">
              {labelled.map((c) => (
                <div
                  key={c.key}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5"
                >
                  <dt className="text-muted-foreground shrink-0 font-medium">
                    {c.header}
                  </dt>
                  <dd className="text-end">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {unlabelled.map((c) => (
              <div
                key={c.key}
                className="border-border mt-3 border-t pt-3"
              >
                {c.cell(row)}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
