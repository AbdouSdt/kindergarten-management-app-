import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "لوحة التحكم" };

const quickLinks = [
  { href: "/admin/children", label: "إدارة الأطفال" },
  { href: "/admin/attendance", label: "تسجيل الحضور اليومي" },
  { href: "/admin/announcements", label: "الإعلانات" },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [childrenC, classroomsC, presentC, absentC] = await Promise.all([
    supabase.from("children").select("*", { count: "exact", head: true }),
    supabase.from("classrooms").select("*", { count: "exact", head: true }),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "present"),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "absent"),
  ]);

  const stats = [
    {
      title: "إجمالي الأطفال",
      value: childrenC.count ?? 0,
      failed: Boolean(childrenC.error),
    },
    {
      title: "الحاضرون اليوم",
      value: presentC.count ?? 0,
      failed: Boolean(presentC.error),
    },
    {
      title: "الغائبون اليوم",
      value: absentC.count ?? 0,
      failed: Boolean(absentC.error),
    },
    {
      title: "عدد الفصول",
      value: classroomsC.count ?? 0,
      failed: Boolean(classroomsC.error),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm">
            نظرة عامة على الحضانة اليوم.
          </p>
        </div>
        <Link
          href="/admin/announcements"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + نشر إعلان
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardTitle>{s.title}</CardTitle>
            {s.failed ? (
              <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                تعذّر تحميل هذا الرقم
              </p>
            ) : (
              <CardValue>{s.value}</CardValue>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border-border hover:bg-muted flex items-center justify-between rounded-lg border p-4 text-sm font-medium transition-colors"
          >
            <span>{link.label}</span>
            <span aria-hidden>←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
