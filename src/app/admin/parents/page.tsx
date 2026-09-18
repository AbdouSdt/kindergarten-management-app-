import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { createAdminClient, createClient } from "@/lib/supabase/server";

import { AddParentDialog } from "./add-parent-dialog";
import { ManageChildrenDialog } from "./manage-children-dialog";
import { DeleteParentButton, EditParentDialog } from "./parent-dialog";

export const metadata: Metadata = { title: "أولياء الأمور" };

export default async function AdminParentsPage() {
  const supabase = await createClient();

  const [parentsRes, childrenRes, guardiansRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("role", "parent")
      .order("full_name"),
    supabase
      .from("children")
      .select("id, first_name, last_name, classrooms(name)")
      .order("first_name"),
    supabase.from("guardians").select("parent_id, child_id, relationship"),
  ]);

  const loadError = parentsRes.error;
  const parents = parentsRes.data ?? [];
  const children = childrenRes.data ?? [];
  const guardians = guardiansRes.data ?? [];

  // Emails live in auth.users — read them with the service-role client (best effort).
  const emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  } catch {
    // Service role key missing/invalid — emails fall back to "—".
  }

  const childById = new Map(children.map((c) => [c.id, c]));
  const linksByParent = new Map<
    string,
    { childId: string; relationship: string | null }[]
  >();
  for (const g of guardians) {
    linksByParent.set(g.parent_id, [
      ...(linksByParent.get(g.parent_id) ?? []),
      { childId: g.child_id, relationship: g.relationship },
    ]);
  }

  const allChildOptions = children.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    classroom: c.classrooms?.name ?? null,
  }));

  const linkedChildrenFor = (parentId: string) =>
    (linksByParent.get(parentId) ?? [])
      .map((l) => {
        const c = childById.get(l.childId);
        return c
          ? {
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
              relationship: l.relationship,
            }
          : null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">أولياء الأمور</h1>
          <p className="text-muted-foreground text-sm">
            {parents.length} ولي أمر مسجّل. اربط كل حساب بأطفاله ليتمكّن من
            متابعتهم.
          </p>
        </div>
        <AddParentDialog />
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : parents.length === 0 ? (
        <EmptyState
          title="لا يوجد أولياء أمور بعد"
          description="اضغط «إضافة ولي أمر» لإنشاء أول حساب."
        />
      ) : (
        <ResponsiveTable
          rows={parents}
          rowKey={(p) => p.id}
          columns={[
            {
              key: "name",
              header: "الاسم",
              cell: (p) => (
                <span className="font-medium">{p.full_name ?? "—"}</span>
              ),
            },
            {
              key: "email",
              header: "البريد الإلكتروني",
              cell: (p) => <span dir="ltr">{emailById.get(p.id) ?? "—"}</span>,
            },
            {
              key: "phone",
              header: "الهاتف",
              cell: (p) => <span dir="ltr">{p.phone ?? "—"}</span>,
            },
            {
              key: "children",
              header: "الأطفال المرتبطون",
              cell: (p) => {
                const linkedChildren = linkedChildrenFor(p.id);

                return linkedChildren.length ? (
                  <ul className="space-y-0.5">
                    {linkedChildren.map((c) => (
                      <li key={c.id}>
                        {c.name}
                        {c.relationship && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {c.relationship}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">لا يوجد</span>
                );
              },
            },
            {
              key: "actions",
              header: "إجراءات",
              labelled: false,
              cell: (p) => {
                const linkedChildren = linkedChildrenFor(p.id);

                return (
                  <div className="flex flex-wrap items-center gap-3">
                    <ManageChildrenDialog
                      parent={{
                        id: p.id,
                        name: p.full_name ?? "ولي الأمر",
                      }}
                      linkedChildren={linkedChildren}
                      allChildren={allChildOptions}
                    />
                    <EditParentDialog
                      parent={{
                        id: p.id,
                        fullName: p.full_name ?? "",
                        email: emailById.get(p.id) ?? "",
                        phone: p.phone ?? "",
                      }}
                    />
                    <DeleteParentButton
                      id={p.id}
                      name={p.full_name ?? "ولي الأمر"}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}
