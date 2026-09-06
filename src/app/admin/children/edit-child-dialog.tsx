"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { updateChild } from "./actions";
import {
  ChildFormFields,
  type ChildDefaults,
  type ClassroomOption,
} from "./child-form-fields";

export function EditChildDialog({
  childId,
  classrooms,
  defaults,
}: {
  childId: string;
  classrooms: ClassroomOption[];
  defaults: ChildDefaults;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateChild,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

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
        title="تعديل بيانات الطفل"
        description="حدّث البيانات أو أضف صورة أو غيّر الفصول."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="child_id" value={childId} />
          <ChildFormFields classrooms={classrooms} defaults={defaults} />

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
