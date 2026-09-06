import Link from "next/link";
import { redirect } from "next/navigation";

import { getProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getProfile();

  // Signed in -> straight to the right dashboard.
  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/parent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">إدارة الحضانة</h1>
        <p className="text-muted-foreground text-lg">
          مكان واحد للمشرفين وأولياء الأمور لإدارة الأطفال والفصول والحضور
          والإعلانات.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          تسجيل الدخول
        </Link>
        <Link
          href="/signup"
          className="border-border rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          إنشاء حساب
        </Link>
      </div>
    </main>
  );
}
