import type { Metadata } from "next";

import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

import { CYCLE_LABEL, StatusPill } from "@/app/admin/subscriptions/status-pill";

export const metadata: Metadata = { title: "الاشتراك" };

export default async function ParentSubscriptionPage() {
  const supabase = await createClient();

  const { data: childrenData } = await supabase
    .from("children")
    .select("id, first_name, last_name, photo_url")
    .order("first_name");

  const kids = childrenData ?? [];
  const kidIds = kids.map((c) => c.id);

  const [{ data: enrolled }, { data: subs }] = kidIds.length
    ? await Promise.all([
        supabase
          .from("child_classrooms")
          .select("child_id, classrooms(name)")
          .in("child_id", kidIds),
        supabase
          .from("subscriptions")
          .select(
            "id, child_id, plan_name, amount, currency, cycle, status, start_date, end_date, notes",
          )
          .in("child_id", kidIds)
          .order("start_date", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const classroomsByChild = new Map<string, string[]>();
  for (const row of enrolled ?? []) {
    const name = row.classrooms?.name;
    if (!name) continue;
    classroomsByChild.set(row.child_id, [
      ...(classroomsByChild.get(row.child_id) ?? []),
      name,
    ]);
  }

  const subsByChild = new Map<string, NonNullable<typeof subs>>();
  for (const s of subs ?? []) {
    subsByChild.set(s.child_id, [...(subsByChild.get(s.child_id) ?? []), s]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الاشتراك</h1>
        <p className="text-muted-foreground text-sm">
          حالة اشتراك كل طفل من أطفالك.
        </p>
      </div>

      {kids.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          لا يوجد أطفال مرتبطون بحسابك بعد.
        </p>
      ) : (
        <div className="space-y-4">
          {kids.map((child) => {
            const fullName = `${child.first_name} ${child.last_name}`.trim();
            const classes = classroomsByChild.get(child.id) ?? [];
            const childSubs = subsByChild.get(child.id) ?? [];

            return (
              <div
                key={child.id}
                className="border-border bg-card rounded-lg border p-5"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={child.photo_url} name={fullName} size={48} />
                  <div>
                    <p className="text-lg font-medium">{fullName}</p>
                    <p className="text-muted-foreground text-sm">
                      {classes.length ? classes.join("، ") : "غير محدد"}
                    </p>
                  </div>
                </div>

                {childSubs.length === 0 ? (
                  <p className="text-muted-foreground mt-4 text-sm">
                    لا يوجد اشتراك مسجّل لهذا الطفل.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {childSubs.map((s) => (
                      <li
                        key={s.id}
                        className="border-border rounded-md border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{s.plan_name}</span>
                          <StatusPill status={s.status} />
                        </div>
                        <dl className="text-muted-foreground mt-2 space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt>المبلغ</dt>
                            <dd className="text-foreground">
                              {s.amount} {s.currency}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt>الدورة</dt>
                            <dd className="text-foreground">
                              {CYCLE_LABEL[s.cycle]}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt>المدة</dt>
                            <dd className="text-foreground text-end">
                              من {formatDate(s.start_date)}{" "}
                              {s.end_date
                                ? `إلى ${formatDate(s.end_date)}`
                                : "— مستمر"}
                            </dd>
                          </div>
                        </dl>
                        {s.notes && (
                          <p className="mt-2 text-sm whitespace-pre-line">
                            {s.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
