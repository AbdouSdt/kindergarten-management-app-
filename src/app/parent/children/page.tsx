import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "أطفالي" };

export default async function ParentChildrenPage() {
  const supabase = await createClient();
  const { data: children } = await supabase
    .from("children")
    .select(
      "id, first_name, last_name, date_of_birth, allergies, classrooms(name)",
    )
    .order("first_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">أطفالي</h1>
        <p className="text-muted-foreground text-sm">
          تفاصيل كل طفل مرتبط بحسابك.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(children ?? []).map((child) => (
          <div
            key={child.id}
            className="border-border bg-card rounded-lg border p-5"
          >
            <p className="text-lg font-medium">
              {child.first_name} {child.last_name}
            </p>
            <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>تاريخ الميلاد</dt>
                <dd>{formatDate(child.date_of_birth)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>الفصل</dt>
                <dd>{child.classrooms?.name ?? "غير محدد"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>الحساسية</dt>
                <dd>{child.allergies ?? "لا يوجد"}</dd>
              </div>
            </dl>
          </div>
        ))}
        {(!children || children.length === 0) && (
          <p className="text-muted-foreground text-sm">
            لا يوجد أطفال مرتبطون بحسابك بعد. يُرجى التواصل مع إدارة الحضانة.
          </p>
        )}
      </div>
    </div>
  );
}
