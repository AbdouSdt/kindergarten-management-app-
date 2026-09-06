import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "لوحة الأستاذ" };

export default function TeacherDashboardPage() {
  return (
    <PlaceholderPage
      title="لوحة الأستاذ"
      description="نظرة عامة على فصولك المسندة."
    />
  );
}
