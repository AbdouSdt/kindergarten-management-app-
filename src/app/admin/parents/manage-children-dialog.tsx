"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

import { linkChildToParent, unlinkChildFromParent } from "./actions";

type LinkedChild = { id: string; name: string; relationship: string | null };
type ChildOption = { id: string; name: string; classroom: string | null };

export function ManageChildrenDialog({
  parent,
  linkedChildren,
  allChildren,
}: {
  parent: { id: string; name: string };
  linkedChildren: LinkedChild[];
  allChildren: ChildOption[];
}) {
  const [open, setOpen] = useState(false);
  const [childId, setChildId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const linkedIds = new Set(linkedChildren.map((c) => c.id));
  const available = allChildren.filter((c) => !linkedIds.has(c.id));

  function add() {
    if (!childId) return;
    setError(null);
    startTransition(async () => {
      const res = await linkChildToParent({
        parentId: parent.id,
        childId,
        relationship,
      });
      if (res.error) setError(res.error);
      else {
        setChildId("");
        setRelationship("");
      }
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await unlinkChildFromParent({ parentId: parent.id, childId: id });
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        إدارة الأطفال
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`أطفال ${parent.name}`}
        description="اربط الأطفال بهذا الحساب أو أزل الارتباط."
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-medium">مرتبط حالياً</h3>
            {linkedChildren.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                لا يوجد أطفال مرتبطون بهذا الحساب.
              </p>
            ) : (
              <ul className="border-border divide-border divide-y rounded-md border">
                {linkedChildren.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-2.5 text-sm"
                  >
                    <span>
                      {c.name}
                      {c.relationship && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {c.relationship}
                        </span>
                      )}
                    </span>
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
            <h3 className="mb-2 text-sm font-medium">إضافة طفل</h3>
            {available.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                لا يوجد أطفال متاحون للإضافة.
              </p>
            ) : (
              <div className="space-y-3">
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className={controlClass}
                >
                  <option value="">— اختر طفلاً —</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.classroom ? ` (${c.classroom})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="صلة القرابة (الأب / الأم / ...)"
                  className={controlClass}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={add}
                    disabled={pending || !childId}
                  >
                    {pending ? "جارٍ الحفظ..." : "ربط"}
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
