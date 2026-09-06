import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "الاشتراك" };

export default function ParentSubscriptionPage() {
  return (
    <PlaceholderPage
      title="الاشتراك"
      description="حالة اشتراك كل طفل من أطفالك."
    />
  );
}
