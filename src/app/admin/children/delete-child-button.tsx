"use client";

import { useState, useTransition } from "react";

import { deleteChild } from "./actions";

export function DeleteChildButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-block text-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `حذف الطفل "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const res = await deleteChild(id);
            if (res.error) setError(res.error);
          });
        }}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "..." : "حذف"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </span>
  );
}
