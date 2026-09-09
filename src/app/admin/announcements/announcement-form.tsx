"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { createAnnouncement, updateAnnouncement } from "./actions";

type ClassroomOption = { id: string; name: string };

export type AnnouncementDefaults = {
  id: string;
  title: string;
  body: string;
  audience: string;
  classroom_id: string | null;
};

const AUDIENCES = [
  { value: "all", label: "الجميع" },
  { value: "parents", label: "أولياء الأمور فقط" },
  { value: "classroom", label: "فصل محدد" },
] as const;

export function AnnouncementForm({
  classrooms,
  announcement,
}: {
  classrooms: ClassroomOption[];
  announcement?: AnnouncementDefaults;
}) {
  const isEdit = Boolean(announcement);
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState(announcement?.audience ?? "all");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isEdit ? updateAnnouncement : createAnnouncement,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    if (isEdit) {
      setOpen(false);
    } else {
      formRef.current?.reset();
      setAudience("all");
    }
  }, [state, isEdit]);

  const fields = (
    <form
      ref={formRef}
      action={formAction}
      className={
        isEdit
          ? "space-y-4"
          : "bg-card border-border space-y-4 rounded-lg border p-5"
      }
    >
      {announcement && (
        <input type="hidden" name="id" value={announcement.id} />
      )}

      <Field label="العنوان" htmlFor="title" required>
        <input
          id="title"
          name="title"
          required
          defaultValue={announcement?.title ?? ""}
          className={controlClass}
        />
      </Field>

      <Field label="النص" htmlFor="body" required>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          defaultValue={announcement?.body ?? ""}
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
              defaultValue={announcement?.classroom_id ?? ""}
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
      {state?.ok && !isEdit && (
        <p className="text-sm text-green-600">تم نشر الإعلان بنجاح.</p>
      )}

      <div className="flex justify-end gap-2">
        {isEdit && (
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {isEdit
            ? pending
              ? "جارٍ الحفظ..."
              : "حفظ"
            : pending
              ? "جارٍ النشر..."
              : "نشر الإعلان"}
        </Button>
      </div>
    </form>
  );

  if (!isEdit) return fields;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary text-sm font-medium hover:underline"
      >
        تعديل
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تعديل الإعلان"
        description="حدّث عنوان الإعلان ونصه. تاريخ النشر وترتيبه لن يتغيّرا."
      >
        {fields}
      </Modal>
    </>
  );
}
