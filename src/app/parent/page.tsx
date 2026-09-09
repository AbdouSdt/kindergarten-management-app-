import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "نظرة عامة" };

export default async function ParentOverviewPage() {
  const supabase = await createClient();

  // RLS ensures a parent only sees their own children.
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, first_name, last_name, photo_url, classrooms(name)");

  const { data: announcements, error: announcementsError } = await supabase
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
          {childrenError ? (
            <EmptyState
              tone="error"
              className="mt-3 p-4"
              title="تعذّر تحميل قائمة الأطفال"
              description="حدّث الصفحة أو حاول لاحقاً."
            />
          ) : !children || children.length === 0 ? (
            <EmptyState
              className="mt-3 p-4"
              title="لا يوجد أطفال مرتبطون بحسابك بعد"
            />
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="flex items-center justify-between"
                >
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
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>أحدث الإعلانات</CardTitle>
          {announcementsError ? (
            <EmptyState
              tone="error"
              className="mt-3 p-4"
              title="تعذّر تحميل الإعلانات"
              description="حدّث الصفحة أو حاول لاحقاً."
            />
          ) : !announcements || announcements.length === 0 ? (
            <EmptyState className="mt-3 p-4" title="لا جديد في الوقت الحالي" />
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {announcements.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground line-clamp-2">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
