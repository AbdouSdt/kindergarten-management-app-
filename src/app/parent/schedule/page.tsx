import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "استعمال الزمن" };

export default function ParentSchedulePage() {
  return (
    <PlaceholderPage
      title="استعمال الزمن"
      description="جدول الحصص الأسبوعي لفصول أطفالك."
    />
  );
}
