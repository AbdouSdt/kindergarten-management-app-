import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "نظرة عامة" };

export default async function ParentOverviewPage() {
  const supabase = await createClient();

  // RLS ensures a parent only sees their own children.
  const { data: children } = await supabase
    .from("children")
    .select("id, first_name, last_name, photo_url, classrooms(name)");

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">مرحباً</h1>
        <p className="text-muted-foreground text-sm">
          إليك آخر المستجدّات الخاصة بعائلتك.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>أطفالي</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {(children ?? []).map((child) => (
              <li key={child.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Avatar
                    src={child.photo_url}
                    name={`${child.first_name} ${child.last_name}`}
                    size={28}
                  />
                  {child.first_name} {child.last_name}
                </span>
                <span className="text-muted-foreground">
                  {child.classrooms?.name ?? "غير محدد"}
                </span>
              </li>
            ))}
            {(!children || children.length === 0) && (
              <li className="text-muted-foreground">
                لا يوجد أطفال مرتبطون بحسابك بعد.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <CardTitle>أحدث الإعلانات</CardTitle>
          <ul className="mt-3 space-y-3 text-sm">
            {(announcements ?? []).map((a) => (
              <li key={a.id}>
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground line-clamp-2">{a.body}</p>
              </li>
            ))}
            {(!announcements || announcements.length === 0) && (
              <li className="text-muted-foreground">لا جديد في الوقت الحالي.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
