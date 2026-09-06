"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

import { assignClassroom, unassignClassroom } from "./actions";

type Classroom = { id: string; name: string };

export function ManageClassroomsDialog({
  teacher,
  assigned,
  allClassrooms,
}: {
  teacher: { id: string; name: string };
  assigned: Classroom[];
  allClassrooms: Classroom[];
}) {
  const [open, setOpen] = useState(false);
  const [classroomId, setClassroomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assigned.map((c) => c.id));
  const available = allClassrooms.filter((c) => !assignedIds.has(c.id));

  function add() {
    if (!classroomId) return;
    setError(null);
    startTransition(async () => {
      const res = await assignClassroom({
        teacherId: teacher.id,
        classroomId,
      });
      if (res.error) setError(res.error);
      else setClassroomId("");
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await unassignClassroom({
        teacherId: teacher.id,
        classroomId: id,
      });
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        إدارة الفصول
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`فصول ${teacher.name}`}
        description="أسند الفصول لهذا الأستاذ أو أزل الإسناد."
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-medium">مسند حالياً</h3>
            {assigned.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                لا توجد فصول مسندة لهذا الأستاذ.
              </p>
            ) : (
              <ul className="border-border divide-border divide-y rounded-md border">
                {assigned.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-2.5 text-sm"
                  >
                    <span>{c.name}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(c.id)}
                      className="shrink-0 text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      إزالة
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-border border-t pt-4">
            <h3 className="mb-2 text-sm font-medium">إسناد فصل</h3>
            {available.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                لا توجد فصول متاحة للإسناد.
              </p>
            ) : (
              <div className="space-y-3">
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className={controlClass}
                >
                  <option value="">— اختر فصلاً —</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={add}
                    disabled={pending || !classroomId}
                  >
                    {pending ? "جارٍ الحفظ..." : "إسناد"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
