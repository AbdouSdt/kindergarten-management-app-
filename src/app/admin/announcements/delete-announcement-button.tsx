"use client";

import { useState, useTransition } from "react";

import { deleteAnnouncement } from "./actions";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="shrink-0 text-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("حذف هذا الإعلان نهائياً؟")) return;
          setError(null);
          startTransition(async () => {
            const res = await deleteAnnouncement(id);
            if (res.error) setError(res.error);
          });
        }}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "..." : "حذف"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
