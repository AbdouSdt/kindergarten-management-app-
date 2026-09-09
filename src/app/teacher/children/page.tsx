import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { getProfile, getTeacherClassroomIds } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "أطفال فصولي" };

export default async function TeacherChildrenPage() {
  const supabase = await createClient();

  const profile = await getProfile();
  const classroomIds = profile ? await getTeacherClassroomIds(profile.id) : [];

  if (classroomIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">أطفال فصولي</h1>
          <p className="text-muted-foreground text-sm">
            الأطفال المسجّلون في فصولك المسندة.
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          لم تُسنَد إليك فصول بعد. تواصل مع الإدارة.
        </p>
      </div>
    );
  }

  const { data: classrooms, error: classroomsError } = await supabase
    .from("classrooms")
    .select("id, name")
    .in("id", classroomIds);
  const classroomName = new Map((classrooms ?? []).map((c) => [c.id, c.name]));

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("child_classrooms")
    .select("child_id, classroom_id")
    .in("classroom_id", classroomIds);

  const loadError = classroomsError ?? enrollmentsError;

  const classroomsByChild = new Map<string, string[]>();
  for (const row of enrollments ?? []) {
    classroomsByChild.set(row.child_id, [
      ...(classroomsByChild.get(row.child_id) ?? []),
      classroomName.get(row.classroom_id) ?? "",
    ]);
  }
  const childIds = [...classroomsByChild.keys()];

  const { data: children } = childIds.length
    ? await supabase
        .from("children")
        .select("id, first_name, last_name, photo_url, date_of_birth")
        .in("id", childIds)
        .order("first_name")
    : {
        data: [] as {
          id: string;
          first_name: string;
          last_name: string;
          photo_url: string | null;
          date_of_birth: string;
        }[],
      };

  const { data: guardians } = childIds.length
    ? await supabase
        .from("guardians")
        .select("child_id, parent_id")
        .in("child_id", childIds)
    : { data: [] as { child_id: string; parent_id: string }[] };

  const childrenList = children ?? [];
  const guardianList = guardians ?? [];

  const parentIds = [...new Set(guardianList.map((g) => g.parent_id))];
  const { data: parents } = parentIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", parentIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const parentName = new Map((parents ?? []).map((p) => [p.id, p.full_name]));

  const guardiansByChild = new Map<string, string[]>();
  for (const g of guardianList) {
    const name = parentName.get(g.parent_id);
    if (!name) continue;
    guardiansByChild.set(g.child_id, [
      ...(guardiansByChild.get(g.child_id) ?? []),
      name,
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">أطفال فصولي</h1>
        <p className="text-muted-foreground text-sm">
          {childrenList.length} طفل في فصولك المسندة.
        </p>
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : childrenList.length === 0 ? (
        <EmptyState title="لا يوجد أطفال في فصولك بعد" />
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-muted-foreground text-start">
              <tr>
                <th className="px-4 py-2.5 font-medium">الاسم</th>
                <th className="px-4 py-2.5 font-medium">الفصول</th>
                <th className="px-4 py-2.5 font-medium">أولياء الأمور</th>
                <th className="px-4 py-2.5 font-medium">تاريخ الميلاد</th>
              </tr>
            </thead>
            <tbody>
              {childrenList.map((child) => {
                const rooms = (classroomsByChild.get(child.id) ?? []).filter(
                  Boolean,
                );
                const parentNames = guardiansByChild.get(child.id) ?? [];
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
                      {rooms.length ? (
                        rooms.join("، ")
                      ) : (
                        <span className="text-muted-foreground">غير محدد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {parentNames.length ? (
                        parentNames.join("، ")
                      ) : (
                        <span className="text-muted-foreground">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(child.date_of_birth)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
