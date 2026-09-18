import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

import { AddChildDialog } from "./add-child-dialog";
import { DeleteChildButton } from "./delete-child-button";
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
      supabase
        .from("child_classrooms")
        .select("child_id, classroom_id, is_primary"),
    ]);

  const loadError = childrenRes.error;
  // Secondary lookups feed the classroom-name and guardian columns; if any
  // fails those cells would silently blank out, so flag it.
  const lookupError = Boolean(
    classroomsRes.error ||
    parentsRes.error ||
    guardiansRes.error ||
    enrollRes.error,
  );
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

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : children.length === 0 ? (
        <EmptyState
          title="لا يوجد أطفال بعد"
          description="اضغط «إضافة طفل» للبدء."
        />
      ) : (
        <>
          {lookupError && (
            <EmptyState
              tone="error"
              title="تعذّر تحميل بعض البيانات المرتبطة"
              description="قد لا تظهر أسماء الفصول أو أولياء الأمور كاملة. حدّث الصفحة."
            />
          )}
          <ResponsiveTable
            rows={children}
            rowKey={(child) => child.id}
            columns={[
              {
                key: "name",
                header: "الاسم",
                cell: (child) => (
                  <span className="flex items-center gap-2.5 font-medium">
                    <Avatar
                      src={child.photo_url}
                      name={`${child.first_name} ${child.last_name}`}
                      size={32}
                    />
                    {child.first_name} {child.last_name}
                  </span>
                ),
              },
              {
                key: "classrooms",
                header: "الفصول",
                cell: (child) => {
                  const enrolled = classroomsByChild.get(child.id);
                  return enrolled?.names.filter(Boolean).length
                    ? enrolled.names.filter(Boolean).join("، ")
                    : "غير محدد";
                },
              },
              {
                key: "parents",
                header: "أولياء الأمور",
                cell: (child) => {
                  const names = parentsByChild.get(child.id) ?? [];
                  return names.length ? (
                    names.join("، ")
                  ) : (
                    <span className="text-muted-foreground">لا يوجد</span>
                  );
                },
              },
              {
                key: "dob",
                header: "تاريخ الميلاد",
                cell: (child) => formatDate(child.date_of_birth),
              },
              {
                key: "actions",
                header: "إجراءات",
                labelled: false,
                cell: (child) => {
                  const enrolled = classroomsByChild.get(child.id);
                  return (
                    <span className="flex items-center gap-3">
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
                      <DeleteChildButton
                        id={child.id}
                        name={`${child.first_name} ${child.last_name}`}
                      />
                    </span>
                  );
                },
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
