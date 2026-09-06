import type { Metadata } from "next";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database.types";

import {
  DeleteSubscriptionButton,
  SubscriptionDialog,
  type SubscriptionChildOption,
} from "./subscription-dialog";
import { CYCLE_LABEL, StatusPill } from "./status-pill";

export const metadata: Metadata = { title: "الاشتراكات" };

type Cycle = Database["public"]["Enums"]["subscription_cycle"];

const MONTHLY_DIVISOR: Record<Cycle, number> = {
  monthly: 1,
  termly: 3,
  annual: 12,
};

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const [subsRes, childrenRes, enrollRes, classroomsRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, child_id, plan_name, amount, currency, cycle, status, start_date, end_date, notes",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("children")
      .select("id, first_name, last_name")
      .order("last_name"),
    supabase
      .from("child_classrooms")
      .select("child_id, classroom_id, is_primary"),
    supabase.from("classrooms").select("id, name").order("name"),
  ]);

  const subscriptions = subsRes.data ?? [];
  const children = childrenRes.data ?? [];
  const classroomName = new Map(
    (classroomsRes.data ?? []).map((c) => [c.id, c.name]),
  );

  const childName = new Map(
    children.map((c) => [c.id, `${c.first_name} ${c.last_name}`.trim()]),
  );

  const classroomByChild = new Map<string, string>();
  for (const row of enrollRes.data ?? []) {
    const name = classroomName.get(row.classroom_id);
    if (!name) continue;
    if (row.is_primary || !classroomByChild.has(row.child_id)) {
      classroomByChild.set(row.child_id, name);
    }
  }

  const childOptions: SubscriptionChildOption[] = children.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    classroomName: classroomByChild.get(c.id) ?? null,
  }));

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const activeCount = activeSubs.length;
  const overdueCount = subscriptions.filter(
    (s) => s.status === "overdue",
  ).length;
  const pausedCount = subscriptions.filter((s) => s.status === "paused").length;

  const monthlyRevenue = activeSubs.reduce(
    (sum, s) => sum + s.amount / MONTHLY_DIVISOR[s.cycle],
    0,
  );

  const currencyCounts = new Map<string, number>();
  for (const s of activeSubs) {
    currencyCounts.set(s.currency, (currencyCounts.get(s.currency) ?? 0) + 1);
  }
  let revenueCurrency = "MAD";
  let topCount = 0;
  for (const [cur, count] of currencyCounts) {
    if (count > topCount) {
      topCount = count;
      revenueCurrency = cur;
    }
  }

  const stats = [
    { title: "اشتراكات نشطة", value: String(activeCount) },
    { title: "متأخرة", value: String(overdueCount) },
    { title: "موقوفة", value: String(pausedCount) },
    {
      title: "الإيراد الشهري التقديري",
      value: `${Math.round(monthlyRevenue)} ${revenueCurrency}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الاشتراكات</h1>
          <p className="text-muted-foreground text-sm">
            اشتراكات الأطفال الشهرية والفصلية والسنوية وحالتها.
          </p>
        </div>
        <SubscriptionDialog childrenList={childOptions} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardTitle>{s.title}</CardTitle>
            <CardValue>{s.value}</CardValue>
          </Card>
        ))}
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted text-muted-foreground text-start">
            <tr>
              <th className="px-4 py-2.5 font-medium">الطفل</th>
              <th className="px-4 py-2.5 font-medium">الخطة</th>
              <th className="px-4 py-2.5 font-medium">المبلغ</th>
              <th className="px-4 py-2.5 font-medium">الدورة</th>
              <th className="px-4 py-2.5 font-medium">الحالة</th>
              <th className="px-4 py-2.5 font-medium">البداية</th>
              <th className="px-4 py-2.5 font-medium">النهاية</th>
              <th className="px-4 py-2.5 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => {
              const name = childName.get(s.child_id) ?? "طفل غير معروف";
              return (
                <tr key={s.id} className="border-border border-t align-top">
                  <td className="px-4 py-3 font-medium">{name}</td>
                  <td className="px-4 py-3">{s.plan_name}</td>
                  <td className="px-4 py-3">
                    {s.amount} {s.currency}
                  </td>
                  <td className="px-4 py-3">{CYCLE_LABEL[s.cycle]}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(s.start_date)}</td>
                  <td className="px-4 py-3">
                    {s.end_date ? formatDate(s.end_date) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <SubscriptionDialog
                        childrenList={childOptions}
                        subscription={{
                          id: s.id,
                          child_id: s.child_id,
                          child_name: name,
                          plan_name: s.plan_name,
                          amount: s.amount,
                          currency: s.currency,
                          cycle: s.cycle,
                          status: s.status,
                          start_date: s.start_date,
                          end_date: s.end_date,
                          notes: s.notes,
                        }}
                      />
                      <DeleteSubscriptionButton id={s.id} />
                    </span>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  لا توجد اشتراكات بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
