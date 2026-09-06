import Link from "next/link";
import { redirect } from "next/navigation";

import { getProfile, homePathForRole } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getProfile();

  // Signed in -> straight to the right dashboard.
  if (profile) {
    redirect(homePathForRole(profile.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">إدارة الحضانة</h1>
        <p className="text-muted-foreground text-lg">
          منصّة موحّدة للإدارة والأساتذة وأولياء الأمور: الأطفال والفصول والحضور
          واستعمال الزمن والاشتراكات والإعلانات.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          تسجيل الدخول
        </Link>
      </div>
    </main>
  );
}
