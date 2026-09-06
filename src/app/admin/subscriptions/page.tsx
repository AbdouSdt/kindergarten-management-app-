import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "الاشتراكات" };

export default function AdminSubscriptionsPage() {
  return (
    <PlaceholderPage
      title="الاشتراكات"
      description="اشتراكات الأطفال الشهرية والفصلية وحالتها."
    />
  );
}
