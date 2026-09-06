import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "الإعلانات" };

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الإعلانات</h1>
        <p className="text-muted-foreground text-sm">أخبار من الحضانة.</p>
      </div>

      <div className="space-y-4">
        {(announcements ?? []).map((a) => (
          <article
            key={a.id}
            className="border-border bg-card rounded-lg border p-5"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{a.title}</h2>
              <span className="text-muted-foreground text-xs">
                {formatDate(a.published_at)}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">
              {a.body}
            </p>
          </article>
        ))}
        {(!announcements || announcements.length === 0) && (
          <p className="text-muted-foreground text-sm">لا توجد إعلانات بعد.</p>
        )}
      </div>
    </div>
  );
}
