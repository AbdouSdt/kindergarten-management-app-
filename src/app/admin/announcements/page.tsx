import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

import { AnnouncementForm } from "./announcement-form";
import { DeleteAnnouncementButton } from "./delete-announcement-button";

export const metadata: Metadata = { title: "الإعلانات" };

const AUDIENCE_LABEL: Record<string, string> = {
  all: "الجميع",
  parents: "أولياء الأمور",
  classroom: "فصل محدد",
};

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const [announcementsRes, classroomsRes] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, audience, classroom_id, published_at")
      .order("published_at", { ascending: false }),
    supabase.from("classrooms").select("id, name").order("name"),
  ]);

  const announcements = announcementsRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const classroomName = new Map(classrooms.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الإعلانات</h1>
        <p className="text-muted-foreground text-sm">
          أنشئ إعلاناً جديداً ليظهر لأولياء الأمور مباشرةً.
        </p>
      </div>

      <AnnouncementForm classrooms={classrooms} />

      <div className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          الإعلانات المنشورة ({announcements.length})
        </h2>

        {announcements.map((a) => (
          <article
            key={a.id}
            className="border-border bg-card rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium">{a.title}</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatDate(a.published_at)} ·{" "}
                  {a.audience === "classroom" && a.classroom_id
                    ? (classroomName.get(a.classroom_id) ?? "فصل محدد")
                    : (AUDIENCE_LABEL[a.audience] ?? a.audience)}
                </p>
              </div>
              <DeleteAnnouncementButton id={a.id} />
            </div>
            <p className="mt-2 text-sm whitespace-pre-line">{a.body}</p>
          </article>
        ))}

        {announcements.length === 0 && (
          <p className="text-muted-foreground text-sm">لا توجد إعلانات بعد.</p>
        )}
      </div>
    </div>
  );
}
