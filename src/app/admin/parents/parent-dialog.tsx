"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { deleteParent, updateParent } from "./actions";

function generatePassword(length = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c?.getRandomValues) {
    const arr = new Uint32Array(length);
    c.getRandomValues(arr);
    for (let i = 0; i < length; i += 1) out += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < length; i += 1)
      out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export type ParentDefaults = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

export function EditParentDialog({ parent }: { parent: ParentDefaults }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateParent,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) {
      // Read the password from the action result, never from the DOM input —
      // React 19 can reset the form before this effect runs.
      if (state.password) setNewPassword(state.password);
      else setOpen(false);
    }
  }, [state]);

  function close() {
    setOpen(false);
    setNewPassword(null);
    formRef.current?.reset();
  }

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
        onClose={close}
        title="تعديل ولي الأمر"
        description="حدّث بيانات الحساب أو عيّن كلمة مرور جديدة."
      >
        {newPassword ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-600/30 bg-green-600/10 p-4 text-sm">
              <p className="font-medium text-green-700">تم حفظ التعديلات.</p>
              <p className="text-muted-foreground mt-2">
                كلمة المرور الجديدة — انسخها وسلّمها لولي الأمر:
              </p>
              <p dir="ltr" className="mt-2 font-medium">
                {newPassword}
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                تم
              </Button>
            </div>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={parent.id} />

            <Field label="الاسم الكامل" htmlFor="full_name" required>
              <input
                id="full_name"
                name="full_name"
                required
                defaultValue={parent.fullName}
                className={controlClass}
              />
            </Field>
            <Field label="البريد الإلكتروني" htmlFor="email" required>
              <input
                id="email"
                name="email"
                type="email"
                required
                dir="ltr"
                defaultValue={parent.email}
                className={controlClass}
              />
            </Field>
            <Field label="الهاتف" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                dir="ltr"
                defaultValue={parent.phone}
                className={controlClass}
              />
            </Field>
            <Field
              label="كلمة مرور جديدة"
              htmlFor="password"
              hint="اتركه فارغاً للإبقاء على كلمة المرور الحالية. 8 أحرف على الأقل."
            >
              <div className="flex gap-2">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="text"
                  minLength={8}
                  dir="ltr"
                  className={controlClass}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (passwordRef.current)
                      passwordRef.current.value = generatePassword();
                  }}
                >
                  توليد
                </Button>
              </div>
            </Field>

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>
                إلغاء
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export function DeleteParentButton({
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
              `حذف حساب ولي الأمر "${name}"؟ سيفقد الوصول إلى بيانات الأطفال نهائياً.`,
            )
          )
            return;
          setError(null);
          startTransition(async () => {
            const res = await deleteParent(id);
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
