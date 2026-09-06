import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "الفصول" };

export default function AdminClassroomsPage() {
  return (
    <PlaceholderPage
      title="الفصول"
      description="إنشاء الفصول وتحديد سعتها وتوزيع الأطفال عليها."
    />
  );
}
