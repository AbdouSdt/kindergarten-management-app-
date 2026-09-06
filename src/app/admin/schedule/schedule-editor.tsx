"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { createSlot, deleteSlot, updateSlot } from "./actions";

type Classroom = { id: string; name: string };
type Teacher = { id: string; full_name: string | null };
type Slot = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  title: string;
  teacher_id: string | null;
  teacherName: string | null;
};

const WEEKDAYS = [
  { value: 0, label: "الاثنين" },
  { value: 1, label: "الثلاثاء" },
  { value: 2, label: "الأربعاء" },
  { value: 3, label: "الخميس" },
  { value: 4, label: "الجمعة" },
  { value: 5, label: "السبت" },
] as const;

const DAYS = WEEKDAYS.map((d) => d.value);
const WEEKDAY_LABEL = new Map<number, string>(
  WEEKDAYS.map((d) => [d.value, d.label]),
);

function hhmm(value: string) {
  return value.slice(0, 5);
}

export function ScheduleEditor({
  classrooms,
  teachers,
  selectedClassroom,
  slots,
}: {
  classrooms: Classroom[];
  teachers: Teacher[];
  selectedClassroom: string | null;
  slots: Slot[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; slot: Slot } | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onDelete(slot: Slot) {
    if (!window.confirm(`حذف حصة «${slot.title}»؟`)) return;
    setPendingDelete(slot.id);
    setDeleteError(null);
    const res = await deleteSlot(slot.id);
    setPendingDelete(null);
    if (res.error) setDeleteError(res.error);
    else router.refresh();
  }

  const grouped = DAYS.map((day) => ({
    day,
    label: WEEKDAY_LABEL.get(day) ?? `يوم ${day}`,
    items: slots
      .filter((s) => s.weekday === day)
      .slice()
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {classrooms.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.push(`/admin/schedule?classroom=${c.id}`)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              c.id === selectedClassroom
                ? "bg-primary text-primary-foreground border-transparent"
                : "border-border hover:bg-muted",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => setDialog({ mode: "create" })}>
          + إضافة حصة
        </Button>
      </div>

      {slots.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          لم تُضَف أي حصة لهذا الفصل بعد.
        </p>
      ) : (
        <WeeklySchedule
          slots={slots.map((s) => ({
            id: s.id,
            weekday: s.weekday,
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            title: s.title,
            teacherName: s.teacherName,
          }))}
          days={DAYS}
        />
      )}

      {deleteError ? (
        <p className="text-sm text-red-600">{deleteError}</p>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-medium">
          تعديل الحصص
        </h2>
        {grouped.map((g) => (
          <div key={g.day} className="space-y-2">
            <h3 className="text-sm font-medium">{g.label}</h3>
            {g.items.length === 0 ? (
              <p className="text-muted-foreground/60 text-sm">—</p>
            ) : (
              <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                {g.items.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm">
                      <span
                        dir="ltr"
                        className="text-muted-foreground text-xs"
                      >
                        {hhmm(s.starts_at)}–{hhmm(s.ends_at)}
                      </span>{" "}
                      <span className="font-medium">{s.title}</span>
                      {s.teacherName ? (
                        <span className="text-muted-foreground text-xs">
                          {" · "}
                          {s.teacherName}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialog({ mode: "edit", slot: s })}
                      >
                        تعديل
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onDelete(s)}
                        disabled={pendingDelete === s.id}
                      >
                        {pendingDelete === s.id ? "جارٍ الحذف..." : "حذف"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {dialog && selectedClassroom ? (
        <SlotFormModal
          key={dialog.mode === "edit" ? dialog.slot.id : "new"}
          classroomId={selectedClassroom}
          teachers={teachers}
          slot={dialog.mode === "edit" ? dialog.slot : null}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function SlotFormModal({
  classroomId,
  teachers,
  slot,
  onClose,
  onSaved,
}: {
  classroomId: string;
  teachers: Teacher[];
  slot: Slot | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = slot !== null;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    editing ? updateSlot : createSlot,
    null,
  );

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "تعديل حصة" : "إضافة حصة"}
      description="حدّد اليوم والوقت والعنوان، واختر الأستاذ إن وُجد."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="classroom_id" value={classroomId} />
        {slot ? <input type="hidden" name="id" value={slot.id} /> : null}

        <Field label="اليوم" htmlFor="weekday" required>
          <select
            id="weekday"
            name="weekday"
            defaultValue={slot ? String(slot.weekday) : "0"}
            className={controlClass}
          >
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="من" htmlFor="starts_at" required>
            <input
              id="starts_at"
              name="starts_at"
              type="time"
              required
              defaultValue={slot ? hhmm(slot.starts_at) : ""}
              className={controlClass}
            />
          </Field>
          <Field label="إلى" htmlFor="ends_at" required>
            <input
              id="ends_at"
              name="ends_at"
              type="time"
              required
              defaultValue={slot ? hhmm(slot.ends_at) : ""}
              className={controlClass}
            />
          </Field>
        </div>

        <Field label="العنوان" htmlFor="title" required>
          <input
            id="title"
            name="title"
            required
            defaultValue={slot ? slot.title : ""}
            className={controlClass}
          />
        </Field>

        <Field label="الأستاذ" htmlFor="teacher_id">
          <select
            id="teacher_id"
            name="teacher_id"
            defaultValue={slot?.teacher_id ?? ""}
            className={controlClass}
          >
            <option value="">— بدون —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name ?? "أستاذ بدون اسم"}
              </option>
            ))}
          </select>
        </Field>

        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
