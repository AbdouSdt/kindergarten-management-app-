/**
 * إنشاء مستخدمَين تجريبيَّين لاختبار تدفّق تسجيل الدخول وإعادة التوجيه.
 * Create two throwaway test users (admin + parent) via the Supabase Admin API.
 *
 * التشغيل / Run:
 *   node --env-file=.env.local supabase/seed-test-users.mjs
 *
 * يتطلّب SUPABASE_SERVICE_ROLE_KEY في .env.local (لا تُشغّله في الإنتاج).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Never run against production.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ مفقود NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY في .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: "admin@creche.test",
    password: "Passw0rd!",
    full_name: "منى المشرفة",
    role: "admin",
  },
  {
    email: "parent@creche.test",
    password: "Passw0rd!",
    full_name: "سعيد ولي الأمر",
    role: "parent",
  },
];

async function findUserByEmail(email) {
  // listUsers is paginated; one page is plenty for a fresh project.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

for (const u of TEST_USERS) {
  let user = await findUserByEmail(u.email);

  if (user) {
    await supabase.auth.admin.updateUserById(user.id, {
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    console.log(`↻ محدَّث: ${u.email} (${u.role})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    if (error) {
      console.error(`✗ فشل إنشاء ${u.email}:`, error.message);
      continue;
    }
    user = data.user;
    console.log(`✓ أُنشئ: ${u.email} (${u.role})`);
  }

  // Make sure the profile row reflects the intended role (the handle_new_user
  // trigger seeds it, but this keeps re-runs deterministic).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: u.role, full_name: u.full_name })
    .eq("id", user.id);
  if (profileError) {
    console.error(`  ⚠ تعذّر ضبط ملف ${u.email}:`, profileError.message);
  }
}

console.log("\nبيانات الدخول للاختبار / Test credentials:");
console.log("  المشرف  admin  →  admin@creche.test  /  Passw0rd!");
console.log("  ولي أمر parent →  parent@creche.test /  Passw0rd!");
