"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { saveAttendance } from "./actions";

type Classroom = { id: string; name: string };
type Child = { id: string; first_name: string; last_name: string };

const STATUSES = [
  { value: "present", label: "حاضر" },
  { value: "absent", label: "غائب" },
  { value: "late", label: "متأخر" },
  { value: "excused", label: "بعذر" },
] as const;

type StatusValue = (typeof STATUSES)[number]["value"];

export function TeacherAttendanceBoard({
  classrooms,
  selectedClassroom,
  date,
  childrenList,
  initial,
}: {
  classrooms: Classroom[];
  selectedClassroom: string | null;
  date: string;
  childrenList: Child[];
  initial: Record<string, StatusValue>;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, StatusValue>>(() =>
    Object.fromEntries(
      childrenList.map((c) => [c.id, initial[c.id] ?? "present"]),
    ),
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function navigate(next: { classroom?: string; date?: string }) {
    const params = new URLSearchParams({
      classroom: next.classroom ?? selectedClassroom ?? "",
      date: next.date ?? date,
    });
    router.push(`/teacher/attendance?${params.toString()}`);
  }

  function setAll(value: StatusValue) {
    setStatuses(Object.fromEntries(childrenList.map((c) => [c.id, value])));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveAttendance({
        date,
        entries: childrenList.map((c) => ({
          childId: c.id,
          status: statuses[c.id] ?? "present",
        })),
      });
      if (res.error) {
        setMessage({ ok: false, text: res.error });
      } else {
        setMessage({ ok: true, text: `تم حفظ حضور ${res.count} طفل.` });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {classrooms.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate({ classroom: c.id })}
            className={cn(
              "flex min-h-[44px] items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              c.id === selectedClassroom
                ? "bg-primary text-primary-foreground border-transparent"
                : "border-border hover:bg-muted",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label htmlFor="att-date" className="text-sm font-medium">
            التاريخ
          </label>
          <input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => navigate({ date: e.target.value })}
            className={controlClass}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAll("present")}
          >
            تعليم الكل حاضر
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAll("absent")}
          >
            تعليم الكل غائب
          </Button>
        </div>
      </div>

      {childrenList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          لا يوجد أطفال في هذا الفصل.
        </p>
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {childrenList.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium">
                {c.first_name} {c.last_name}
              </span>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      setStatuses((prev) => ({ ...prev, [c.id]: s.value }))
                    }
                    className={cn(
                      "flex min-h-[44px] items-center rounded-md px-3.5 py-1.5 text-sm transition-colors",
                      statuses[c.id] === s.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p
          className={cn(
            "text-sm",
            message.ok ? "text-green-600" : "text-red-600",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={pending || childrenList.length === 0}
        >
          {pending ? "جارٍ الحفظ..." : "حفظ الحضور"}
        </Button>
      </div>
    </div>
  );
}
