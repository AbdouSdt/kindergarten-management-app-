import { AppShell } from "@/components/nav/app-shell";
import { requireRole } from "@/lib/auth";

const navItems = [
  { label: "لوحة التحكم", href: "/admin" },
  { label: "الأطفال", href: "/admin/children" },
  { label: "أولياء الأمور", href: "/admin/parents" },
  { label: "الطاقم", href: "/admin/staff" },
  { label: "الفصول", href: "/admin/classrooms" },
  { label: "الحضور", href: "/admin/attendance" },
  { label: "استعمال الزمن", href: "/admin/schedule" },
  { label: "الاشتراكات", href: "/admin/subscriptions" },
  { label: "الإعلانات", href: "/admin/announcements" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <AppShell title="لوحة المشرف" navItems={navItems} userName={profile.full_name}>
      {children}
    </AppShell>
  );
}
