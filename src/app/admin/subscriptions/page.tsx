import type { Metadata } from "next";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { formatCurrency } from "@/lib/currency";
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

  const loadError = subsRes.error;
  // Secondary lookups feed the child-name and classroom columns; surface a hint
  // rather than let those cells blank out silently.
  const lookupError = Boolean(
    childrenRes.error || enrollRes.error || classroomsRes.error,
  );
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

  const stats = [
    { title: "اشتراكات نشطة", value: String(activeCount) },
    { title: "متأخرة", value: String(overdueCount) },
    { title: "موقوفة", value: String(pausedCount) },
    {
      title: "الإيراد الشهري التقديري",
      value: formatCurrency(Math.round(monthlyRevenue)),
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

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : subscriptions.length === 0 ? (
        <EmptyState title="لا توجد اشتراكات بعد" />
      ) : (
        <>
          {lookupError && (
            <EmptyState
              tone="error"
              title="تعذّر تحميل بعض البيانات المرتبطة"
              description="قد لا تظهر أسماء الأطفال أو الفصول بشكل صحيح. حدّث الصفحة."
            />
          )}
          <ResponsiveTable
            rows={subscriptions}
            rowKey={(s) => s.id}
            columns={[
              {
                key: "child",
                header: "الطفل",
                cell: (s) => (
                  <span className="font-medium">
                    {childName.get(s.child_id) ?? "طفل غير معروف"}
                  </span>
                ),
              },
              {
                key: "plan",
                header: "الخطة",
                cell: (s) => s.plan_name,
              },
              {
                key: "amount",
                header: "المبلغ",
                cell: (s) => formatCurrency(s.amount),
              },
              {
                key: "cycle",
                header: "الدورة",
                cell: (s) => CYCLE_LABEL[s.cycle],
              },
              {
                key: "status",
                header: "الحالة",
                cell: (s) => <StatusPill status={s.status} />,
              },
              {
                key: "start",
                header: "البداية",
                cell: (s) => formatDate(s.start_date),
              },
              {
                key: "end",
                header: "النهاية",
                cell: (s) => (s.end_date ? formatDate(s.end_date) : "—"),
              },
              {
                key: "actions",
                header: "إجراءات",
                labelled: false,
                cell: (s) => {
                  const name = childName.get(s.child_id) ?? "طفل غير معروف";
                  return (
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
                  );
                },
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
