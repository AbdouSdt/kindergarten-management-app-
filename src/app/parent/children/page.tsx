import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "أطفالي" };

export default async function ParentChildrenPage() {
  const supabase = await createClient();

  const { data: children } = await supabase
    .from("children")
    .select("id, first_name, last_name, date_of_birth, allergies, photo_url")
    .order("first_name");

  const kids = children ?? [];

  const { data: enrolled } = kids.length
    ? await supabase
        .from("child_classrooms")
        .select("child_id, classrooms(name)")
        .in(
          "child_id",
          kids.map((c) => c.id),
        )
    : { data: [] };

  const classroomsByChild = new Map<string, string[]>();
  for (const row of enrolled ?? []) {
    const name = row.classrooms?.name;
    if (!name) continue;
    classroomsByChild.set(row.child_id, [
      ...(classroomsByChild.get(row.child_id) ?? []),
      name,
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">أطفالي</h1>
        <p className="text-muted-foreground text-sm">
          تفاصيل كل طفل مرتبط بحسابك.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {kids.map((child) => {
          const classes = classroomsByChild.get(child.id) ?? [];
          return (
            <div
              key={child.id}
              className="border-border bg-card rounded-lg border p-5"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={child.photo_url}
                  name={`${child.first_name} ${child.last_name}`}
                  size={48}
                />
                <p className="text-lg font-medium">
                  {child.first_name} {child.last_name}
                </p>
              </div>
              <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>تاريخ الميلاد</dt>
                  <dd>{formatDate(child.date_of_birth)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>الفصول</dt>
                  <dd className="text-end">
                    {classes.length ? classes.join("، ") : "غير محدد"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>الحساسية</dt>
                  <dd>{child.allergies ?? "لا يوجد"}</dd>
                </div>
              </dl>
            </div>
          );
        })}
        {kids.length === 0 && (
          <p className="text-muted-foreground text-sm">
            لا يوجد أطفال مرتبطون بحسابك بعد. يُرجى التواصل مع إدارة الحضانة.
          </p>
        )}
      </div>
    </div>
  );
}
