import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

import { AddChildDialog } from "./add-child-dialog";

export const metadata: Metadata = { title: "الأطفال" };

export default async function AdminChildrenPage() {
  const supabase = await createClient();

  const [childrenRes, classroomsRes, parentsRes, guardiansRes] =
    await Promise.all([
      supabase
        .from("children")
        .select("id, first_name, last_name, date_of_birth, classrooms(name)")
        .order("last_name"),
      supabase.from("classrooms").select("id, name").order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "parent")
        .order("full_name"),
      supabase.from("guardians").select("child_id, parent_id"),
    ]);

  const children = childrenRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const parents = parentsRes.data ?? [];

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
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-muted-foreground text-start">
            <tr>
              <th className="px-4 py-2.5 font-medium">الاسم</th>
              <th className="px-4 py-2.5 font-medium">الفصل</th>
              <th className="px-4 py-2.5 font-medium">أولياء الأمور</th>
              <th className="px-4 py-2.5 font-medium">تاريخ الميلاد</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const names = parentsByChild.get(child.id) ?? [];
              return (
                <tr key={child.id} className="border-border border-t">
                  <td className="px-4 py-2.5 font-medium">
                    {child.first_name} {child.last_name}
                  </td>
                  <td className="px-4 py-2.5">
                    {child.classrooms?.name ?? "غير محدد"}
                  </td>
                  <td className="px-4 py-2.5">
                    {names.length ? (
                      names.join("، ")
                    ) : (
                      <span className="text-muted-foreground">لا يوجد</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatDate(child.date_of_birth)}
                  </td>
                </tr>
              );
            })}
            {children.length === 0 && (
              <tr>
                <td
                  colSpan={4}
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
