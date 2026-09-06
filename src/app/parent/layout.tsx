import { AppShell } from "@/components/nav/app-shell";
import { requireRole } from "@/lib/auth";

const navItems = [
  { label: "نظرة عامة", href: "/parent" },
  { label: "أطفالي", href: "/parent/children" },
  { label: "الحضور", href: "/parent/attendance" },
  { label: "استعمال الزمن", href: "/parent/schedule" },
  { label: "الاشتراك", href: "/parent/subscription" },
  { label: "الإعلانات", href: "/parent/announcements" },
];

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("parent");

  return (
    <AppShell
      title="بوابة ولي الأمر"
      navItems={navItems}
      userName={profile.full_name}
    >
      {children}
    </AppShell>
  );
}
