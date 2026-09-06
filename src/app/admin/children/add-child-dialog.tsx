"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { createChild } from "./actions";

type ClassroomOption = { id: string; name: string };
type ParentOption = { id: string; full_name: string | null };

export function AddChildDialog({
  classrooms,
  parents,
}: {
  classrooms: ClassroomOption[];
  parents: ParentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [withParent, setWithParent] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createChild,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      setWithParent(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة طفل</Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="إضافة طفل جديد"
        description="أدخل بيانات الطفل، واختر الفصل وولي الأمر إن وُجد."
      >
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الأول" htmlFor="first_name" required>
              <input
                id="first_name"
                name="first_name"
                required
                autoComplete="off"
                className={controlClass}
              />
            </Field>
            <Field label="اسم العائلة" htmlFor="last_name" required>
              <input
                id="last_name"
                name="last_name"
                required
                autoComplete="off"
                className={controlClass}
              />
            </Field>
          </div>

          <Field label="تاريخ الميلاد" htmlFor="date_of_birth" required>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              required
              className={controlClass}
            />
          </Field>

          <Field label="الفصل" htmlFor="classroom_id">
            <select
              id="classroom_id"
              name="classroom_id"
              defaultValue=""
              className={controlClass}
            >
              <option value="">— بدون فصل —</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الحساسية (اختياري)" htmlFor="allergies">
            <input
              id="allergies"
              name="allergies"
              className={controlClass}
              placeholder="مثال: حساسية من الفول السوداني"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={withParent}
              onChange={(e) => setWithParent(e.target.checked)}
              className="size-4"
            />
            ربط ولي أمر بهذا الطفل
          </label>

          {withParent && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ولي الأمر" htmlFor="parent_id">
                <select
                  id="parent_id"
                  name="parent_id"
                  defaultValue=""
                  className={controlClass}
                >
                  <option value="">— اختر ولي أمر —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? "ولي أمر بدون اسم"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="صلة القرابة" htmlFor="relationship">
                <input
                  id="relationship"
                  name="relationship"
                  className={controlClass}
                  placeholder="الأب / الأم / الجدّة ..."
                />
              </Field>
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

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
