"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { createClassroom, deleteClassroom, updateClassroom } from "./actions";

export type ClassroomDefaults = {
  id: string;
  name: string;
  capacity: number;
};

export function DeleteClassroomButton({
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
          if (!window.confirm(`حذف فصل "${name}"؟`)) return;
          setError(null);
          startTransition(async () => {
            const res = await deleteClassroom(id);
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

export function ClassroomDialog({
  classroom,
}: {
  classroom?: ClassroomDefaults;
}) {
  const isEdit = Boolean(classroom);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isEdit ? updateClassroom : createClassroom,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      if (!isEdit) formRef.current?.reset();
    }
  }, [state, isEdit]);

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-primary text-sm font-medium hover:underline"
        >
          تعديل
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>+ إضافة فصل</Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "تعديل الفصل" : "إضافة فصل"}
        description={
          isEdit
            ? "حدّث اسم الفصل وسعته."
            : "أنشئ فصلاً جديداً وحدّد سعته."
        }
      >
        <form ref={formRef} action={formAction} className="space-y-4">
          {classroom && <input type="hidden" name="id" value={classroom.id} />}

          <Field label="اسم الفصل" htmlFor="name" required>
            <input
              id="name"
              name="name"
              required
              defaultValue={classroom?.name ?? ""}
              className={controlClass}
            />
          </Field>

          <Field
            label="السعة"
            htmlFor="capacity"
            required
            hint="عدد الأطفال الذين يستوعبهم الفصل."
          >
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={classroom ? String(classroom.capacity) : ""}
              className={controlClass}
            />
          </Field>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
