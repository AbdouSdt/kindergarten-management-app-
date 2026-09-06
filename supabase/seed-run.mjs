/**
 * تطبيق البيانات التجريبية عبر واجهة Supabase (بديل عن psql).
 * API-based equivalent of supabase/seed.sql — for environments without `psql`.
 *
 * التشغيل / Run:
 *   node --env-file=.env.local supabase/seed-run.mjs
 *
 * يستخدم SUPABASE_SERVICE_ROLE_KEY ويتجاوز RLS. آمن للتكرار (upsert بمعرّفات ثابتة).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ مفقود NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const CLASS = {
  zohour: "a0000000-0000-0000-0000-000000000001",
  farashat: "a0000000-0000-0000-0000-000000000002",
  nojoum: "a0000000-0000-0000-0000-000000000003",
};
const cid = (n) => `b0000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`;
const aid = (n) => `d0000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`;
const iso = (d) => d.toISOString().slice(0, 10);
const dayAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

async function step(label, promise) {
  const { error } = await promise;
  console.log(error ? `✗ ${label}: ${error.message}` : `✓ ${label}`);
}

await step(
  "classrooms",
  db.from("classrooms").upsert([
    { id: CLASS.zohour, name: "صف الزهور", age_group: "2-3 سنوات", capacity: 16 },
    { id: CLASS.farashat, name: "صف الفراشات", age_group: "3-4 سنوات", capacity: 20 },
    { id: CLASS.nojoum, name: "صف النجوم", age_group: "4-5 سنوات", capacity: 22 },
  ]),
);

await step(
  "children",
  db.from("children").upsert([
    { id: cid(1), first_name: "أحمد", last_name: "المنصوري", date_of_birth: "2023-04-12", classroom_id: CLASS.zohour, allergies: "حساسية من الفول السوداني" },
    { id: cid(2), first_name: "مريم", last_name: "العلوي", date_of_birth: "2023-06-30", classroom_id: CLASS.zohour, notes: "تحتاج قيلولة بعد الغداء" },
    { id: cid(3), first_name: "يوسف", last_name: "الإدريسي", date_of_birth: "2023-02-05", classroom_id: CLASS.zohour },
    { id: cid(4), first_name: "فاطمة الزهراء", last_name: "بن صالح", date_of_birth: "2022-09-18", classroom_id: CLASS.farashat, allergies: "حساسية من البيض" },
    { id: cid(5), first_name: "عمر", last_name: "الحسني", date_of_birth: "2022-11-02", classroom_id: CLASS.farashat },
    { id: cid(6), first_name: "ليلى", last_name: "الطاهري", date_of_birth: "2022-07-25", classroom_id: CLASS.farashat },
    { id: cid(7), first_name: "خالد", last_name: "بوزيد", date_of_birth: "2021-10-14", classroom_id: CLASS.nojoum },
    { id: cid(8), first_name: "نور الهدى", last_name: "العامري", date_of_birth: "2021-12-09", classroom_id: CLASS.nojoum, allergies: "حساسية من منتجات الألبان" },
    { id: cid(9), first_name: "إبراهيم", last_name: "الصديقي", date_of_birth: "2021-08-21", classroom_id: CLASS.nojoum },
  ]),
);

await step(
  "attendance",
  db.from("attendance").upsert(
    [
      { child_id: cid(1), date: dayAgo(1), status: "present" },
      { child_id: cid(2), date: dayAgo(1), status: "present" },
      { child_id: cid(3), date: dayAgo(1), status: "absent", note: "إجازة عائلية" },
      { child_id: cid(4), date: dayAgo(1), status: "late" },
      { child_id: cid(5), date: dayAgo(1), status: "present" },
      { child_id: cid(7), date: dayAgo(1), status: "present" },
      { child_id: cid(8), date: dayAgo(1), status: "excused" },
      { child_id: cid(1), date: dayAgo(2), status: "present" },
      { child_id: cid(2), date: dayAgo(2), status: "late" },
      { child_id: cid(4), date: dayAgo(2), status: "present" },
      { child_id: cid(9), date: dayAgo(2), status: "absent" },
    ],
    { onConflict: "child_id,date" },
  ),
);

await step(
  "announcements",
  db.from("announcements").upsert([
    { id: aid(1), title: "بدء العام الدراسي الجديد", body: "أهلاً بكم في عام دراسي جديد! تبدأ الدراسة يوم الاثنين الساعة الثامنة صباحاً.", audience: "all" },
    { id: aid(2), title: "اجتماع أولياء الأمور", body: "ندعوكم لحضور اجتماع أولياء الأمور يوم الخميس الساعة الخامسة مساءً.", audience: "parents" },
    { id: aid(3), title: "رحلة إلى الحديقة", body: "سينظّم صف النجوم رحلة إلى الحديقة العامة يوم الجمعة. الرجاء التوقيع على استمارة الإذن.", audience: "classroom", classroom_id: CLASS.nojoum },
  ]),
);

// ربط أوّل ولي أمر بطفلين
const { data: parent } = await db
  .from("profiles")
  .select("id")
  .eq("role", "parent")
  .order("created_at")
  .limit(1)
  .maybeSingle();

if (!parent) {
  console.log("⚠ لا يوجد حساب ولي أمر — تخطّي ربط الأطفال. شغّل seed-test-users.mjs أولاً.");
} else {
  await step(
    "guardians",
    db.from("guardians").upsert(
      [
        { child_id: cid(1), parent_id: parent.id, relationship: "الأب", is_primary: true },
        { child_id: cid(4), parent_id: parent.id, relationship: "الأب", is_primary: true },
      ],
      { onConflict: "child_id,parent_id" },
    ),
  );
}

console.log("\nتم. / Done.");
