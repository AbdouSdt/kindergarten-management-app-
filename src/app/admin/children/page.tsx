import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

import { AddChildDialog } from "./add-child-dialog";
import { EditChildDialog } from "./edit-child-dialog";

export const metadata: Metadata = { title: "الأطفال" };

export default async function AdminChildrenPage() {
  const supabase = await createClient();

  const [childrenRes, classroomsRes, parentsRes, guardiansRes, enrollRes] =
    await Promise.all([
      supabase
        .from("children")
        .select(
          "id, first_name, last_name, date_of_birth, allergies, photo_url",
        )
        .order("last_name"),
      supabase.from("classrooms").select("id, name").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "parent")
        .order("full_name"),
      supabase.from("guardians").select("child_id, parent_id"),
      supabase.from("child_classrooms").select("child_id, classroom_id, is_primary"),
    ]);

  const children = childrenRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const parents = parentsRes.data ?? [];

  const classroomName = new Map(classrooms.map((c) => [c.id, c.name]));

  const parentNameById = new Map(parents.map((p) => [p.id, p.full_name]));
  const parentsByChild = new Map<string, string[]>();
  for (const link of guardiansRes.data ?? []) {
    const name = parentNameById.get(link.parent_id);
    if (!name) continue;
    parentsByChild.set(link.child_id, [
      ...(parentsByChild.get(link.child_id) ?? []),
      name,
    ]);
  }

  const classroomsByChild = new Map<
    string,
    { ids: string[]; names: string[] }
  >();
  for (const row of enrollRes.data ?? []) {
    const entry = classroomsByChild.get(row.child_id) ?? { ids: [], names: [] };
    // primary first
    if (row.is_primary) {
      entry.ids.unshift(row.classroom_id);
      entry.names.unshift(classroomName.get(row.classroom_id) ?? "");
    } else {
      entry.ids.push(row.classroom_id);
      entry.names.push(classroomName.get(row.classroom_id) ?? "");
    }
    classroomsByChild.set(row.child_id, entry);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الأطفال</h1>
          <p className="text-muted-foreground text-sm">
            {children.length} طفل مسجّل في الحضانة.
          </p>
        </div>
        <AddChildDialog classrooms={classrooms} parents={parents} />
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-muted-foreground text-start">
            <tr>
              <th className="px-4 py-2.5 font-medium">الاسم</th>
              <th className="px-4 py-2.5 font-medium">الفصول</th>
              <th className="px-4 py-2.5 font-medium">أولياء الأمور</th>
              <th className="px-4 py-2.5 font-medium">تاريخ الميلاد</th>
              <th className="px-4 py-2.5 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const names = parentsByChild.get(child.id) ?? [];
              const enrolled = classroomsByChild.get(child.id);
              return (
                <tr key={child.id} className="border-border border-t align-top">
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2.5">
                      <Avatar
                        src={child.photo_url}
                        name={`${child.first_name} ${child.last_name}`}
                        size={32}
                      />
                      {child.first_name} {child.last_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {enrolled?.names.filter(Boolean).length
                      ? enrolled.names.filter(Boolean).join("، ")
                      : "غير محدد"}
                  </td>
                  <td className="px-4 py-3">
                    {names.length ? (
                      names.join("، ")
                    ) : (
                      <span className="text-muted-foreground">لا يوجد</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(child.date_of_birth)}</td>
                  <td className="px-4 py-3">
                    <EditChildDialog
                      childId={child.id}
                      classrooms={classrooms}
                      defaults={{
                        first_name: child.first_name,
                        last_name: child.last_name,
                        date_of_birth: child.date_of_birth,
                        allergies: child.allergies,
                        photo_url: child.photo_url,
                        classroom_ids: enrolled?.ids ?? [],
                      }}
                    />
                  </td>
                </tr>
              );
            })}
            {children.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  لا يوجد أطفال بعد. اضغط «إضافة طفل» للبدء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
