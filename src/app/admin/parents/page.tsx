import type { Metadata } from "next";

import { createAdminClient, createClient } from "@/lib/supabase/server";

import { ManageChildrenDialog } from "./manage-children-dialog";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">أولياء الأمور</h1>
        <p className="text-muted-foreground text-sm">
          {parents.length} ولي أمر مسجّل. اربط كل حساب بأطفاله ليتمكّن من متابعتهم.
        </p>
      </div>

      {parents.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          لا يوجد أولياء أمور بعد. يمكنهم إنشاء حساب من صفحة «إنشاء حساب».
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-muted-foreground text-start">
              <tr>
                <th className="px-4 py-2.5 font-medium">الاسم</th>
                <th className="px-4 py-2.5 font-medium">البريد الإلكتروني</th>
                <th className="px-4 py-2.5 font-medium">الهاتف</th>
                <th className="px-4 py-2.5 font-medium">الأطفال المرتبطون</th>
                <th className="px-4 py-2.5 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p) => {
                const links = linksByParent.get(p.id) ?? [];
                const linkedChildren = links
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
                  <tr key={p.id} className="border-border border-t align-top">
                    <td className="px-4 py-3 font-medium">
                      {p.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {emailById.get(p.id) ?? "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {linkedChildren.length ? (
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
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ManageChildrenDialog
                        parent={{ id: p.id, name: p.full_name ?? "ولي الأمر" }}
                        linkedChildren={linkedChildren}
                        allChildren={allChildOptions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
