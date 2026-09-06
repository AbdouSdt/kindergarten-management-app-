import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "الطاقم" };

export default function AdminStaffPage() {
  return (
    <PlaceholderPage
      title="الطاقم"
      description="إدارة حسابات الأساتذة وإسنادهم إلى الفصول."
    />
  );
}
