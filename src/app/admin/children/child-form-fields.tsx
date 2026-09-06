"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Field, controlClass } from "@/components/ui/field";

export type ClassroomOption = { id: string; name: string };

export type ChildDefaults = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  allergies?: string | null;
  classroom_ids?: string[];
  photo_url?: string | null;
};

export function ChildFormFields({
  classrooms,
  defaults,
}: {
  classrooms: ClassroomOption[];
  defaults?: ChildDefaults;
}) {
  const [preview, setPreview] = useState<string | null>(
    defaults?.photo_url ?? null,
  );
  const selected = new Set(defaults?.classroom_ids ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar
          src={preview}
          name={`${defaults?.first_name ?? ""} ${defaults?.last_name ?? ""}`}
          size={56}
        />
        <div className="min-w-0">
          <label
            htmlFor="photo"
            className="text-sm font-medium block"
          >
            الصورة (اختياري)
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : defaults?.photo_url ?? null);
            }}
            className="text-muted-foreground mt-1 block w-full text-xs file:me-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الأول" htmlFor="first_name" required>
          <input
            id="first_name"
            name="first_name"
            required
            defaultValue={defaults?.first_name}
            autoComplete="off"
            className={controlClass}
          />
        </Field>
        <Field label="اسم العائلة" htmlFor="last_name" required>
          <input
            id="last_name"
            name="last_name"
            required
            defaultValue={defaults?.last_name}
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
          defaultValue={defaults?.date_of_birth}
          className={controlClass}
        />
      </Field>

      <Field
        label="الفصول"
        hint="يمكن اختيار أكثر من فصل. الأول هو الفصل الأساسي."
      >
        {classrooms.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد فصول بعد.</p>
        ) : (
          <div className="border-border grid gap-1.5 rounded-md border p-2 sm:grid-cols-2">
            {classrooms.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="classroom_ids"
                  value={c.id}
                  defaultChecked={selected.has(c.id)}
                  className="size-4"
                />
                {c.name}
              </label>
            ))}
          </div>
        )}
      </Field>

      <Field label="الحساسية (اختياري)" htmlFor="allergies">
        <input
          id="allergies"
          name="allergies"
          defaultValue={defaults?.allergies ?? ""}
          className={controlClass}
          placeholder="مثال: حساسية من الفول السوداني"
        />
      </Field>
    </div>
  );
}
