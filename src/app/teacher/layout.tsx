import { AppShell } from "@/components/nav/app-shell";
import { requireRole } from "@/lib/auth";

const navItems = [
  { label: "لوحة التحكم", href: "/teacher" },
  { label: "أطفال فصولي", href: "/teacher/children" },
  { label: "الحضور", href: "/teacher/attendance" },
  { label: "استعمال الزمن", href: "/teacher/schedule" },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");

  return (
    <AppShell
      title="بوابة الأستاذ"
      navItems={navItems}
      userName={profile.full_name}
    >
      {children}
    </AppShell>
  );
}
