import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "استعمال الزمن" };

export default function AdminSchedulePage() {
  return (
    <PlaceholderPage
      title="استعمال الزمن"
      description="جدول الحصص الأسبوعي لكل فصل."
    />
  );
}
