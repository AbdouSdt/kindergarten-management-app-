"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import type { FormState } from "@/lib/forms";

import { createAnnouncement } from "./actions";

type ClassroomOption = { id: string; name: string };

const AUDIENCES = [
  { value: "all", label: "الجميع" },
  { value: "parents", label: "أولياء الأمور فقط" },
  { value: "classroom", label: "فصل محدد" },
] as const;

export function AnnouncementForm({
  classrooms,
}: {
  classrooms: ClassroomOption[];
}) {
  const [audience, setAudience] = useState("all");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createAnnouncement,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setAudience("all");
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-card border-border space-y-4 rounded-lg border p-5"
    >
      <Field label="العنوان" htmlFor="title" required>
        <input id="title" name="title" required className={controlClass} />
      </Field>

      <Field label="النص" htmlFor="body" required>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          className={`${controlClass} resize-y`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الجمهور" htmlFor="audience">
          <select
            id="audience"
            name="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={controlClass}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>

        {audience === "classroom" && (
          <Field label="الفصل" htmlFor="classroom_id" required>
            <select
              id="classroom_id"
              name="classroom_id"
              defaultValue=""
              className={controlClass}
            >
              <option value="">— اختر الفصل —</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-green-600">تم نشر الإعلان بنجاح.</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ النشر..." : "نشر الإعلان"}
        </Button>
      </div>
    </form>
  );
}
