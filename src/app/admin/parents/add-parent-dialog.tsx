"use client";

import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { createParent } from "./actions";

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

export function AddParentDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createParent,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  // Captured at submit time from FormData — not read back from the DOM after the
  // form (and its uncontrolled inputs) may have already been reset by React 19.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const submitted =
    state?.ok && state.password && submittedEmail !== null
      ? { email: submittedEmail, password: state.password }
      : null;

  function close() {
    setOpen(false);
    setSubmittedEmail(null);
    formRef.current?.reset();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ إضافة ولي أمر</Button>

      <Modal
        open={open}
        onClose={close}
        title="إضافة ولي أمر"
        description="أنشئ حساباً جديداً لولي أمر وسلّمه بيانات الدخول."
      >
        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-600/30 bg-green-600/10 p-4 text-sm">
              <p className="font-medium text-green-700">
                تم إنشاء الحساب بنجاح.
              </p>
              <p className="text-muted-foreground mt-2">
                انسخ بيانات الدخول التالية وسلّمها لولي الأمر:
              </p>
              <dl className="mt-3 space-y-1.5">
                <div className="flex gap-2">
                  <dt className="font-medium">البريد الإلكتروني:</dt>
                  <dd dir="ltr">{submitted.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">كلمة المرور:</dt>
                  <dd dir="ltr">{submitted.password}</dd>
                </div>
              </dl>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                تم
              </Button>
            </div>
          </div>
        ) : (
          <form
            ref={formRef}
            action={(formData) => {
              setSubmittedEmail(String(formData.get("email") ?? ""));
              formAction(formData);
            }}
            className="space-y-4"
          >
            <Field label="الاسم الكامل" htmlFor="full_name" required>
              <input
                id="full_name"
                name="full_name"
                required
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
                className={controlClass}
              />
            </Field>
            <Field label="الهاتف" htmlFor="phone">
              <input id="phone" name="phone" dir="ltr" className={controlClass} />
            </Field>
            <Field
              label="كلمة المرور"
              htmlFor="password"
              required
              hint="8 أحرف على الأقل."
            >
              <div className="flex gap-2">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="text"
                  required
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
                {pending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
