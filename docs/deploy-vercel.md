<!-- dir: rtl · لغة المحتوى: العربية -->

# نشر المنصة على Vercel والحصول على رابط الإنتاج

دليل مختصر لصاحب المشروع لنشر تطبيق Next.js 15 + Supabase على Vercel.
إتمام هذا الدليل يفكّ عنصر الـ backlog رقم **P2-1** ويهيّئ الرابط الذي يحتاجه **P2-2** (قوقعة Capacitor).

---

## 1. المتطلبات

- حساب على [vercel.com](https://vercel.com) (مجاني يكفي).
- المستودع مدفوع إلى GitHub على الفرع `main`.
- مشروع Supabase قائم وشغّال (Postgres + Auth + Storage).

---

## 2. الاستيراد

1. افتح <https://vercel.com/new>.
2. اختر **Import Git Repository** ثم مستودع هذا المشروع من GitHub.
3. Vercel يكتشف Next.js تلقائيًّا: إطار العمل = Next.js، أمر البناء `next build`،
   مجلد الإخراج مُدار تلقائيًّا. **لا تغيّر أوامر البناء ولا إعدادات الإخراج.**
4. لا تضغط **Deploy** بعد — أضِف متغيّرات البيئة أولًا (القسم التالي).

---

## 3. متغيّرات البيئة

أضِفها في **Project ▸ Settings ▸ Environment Variables** (أو في شاشة الاستيراد).
المفاتيح الأربعة نفسها الموجودة في `.env.local` محليًّا. **ضع القيم الحقيقية في Vercel فقط، لا تكتبها في أي ملف داخل المستودع.**

| المفتاح | من أين يأتي | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ▸ Project Settings ▸ API ▸ Project URL | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | نفس المكان ▸ Project API keys ▸ `anon` `public` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | نفس المكان ▸ Project API keys ▸ `service_role` — **سرّي، لا يُكشف في أي Client Component ولا في السجلّات** | Production + Preview |
| `NEXT_PUBLIC_SITE_URL` | رابط الإنتاج نفسه من Vercel (مثال: `https://your-app.vercel.app`) | Production + Preview |

> القيم أعلاه أمثلة نائبة فقط. انسخ القيم الفعلية من لوحة Supabase مباشرة إلى Vercel.

---

## 4. مشكلة الدجاجة والبيضة في `NEXT_PUBLIC_SITE_URL`

رابط الإنتاج غير معروف قبل أول نشر، لذلك:

1. انشر أولًا بالمفاتيح الثلاثة الخاصة بـ Supabase (اترك `NEXT_PUBLIC_SITE_URL` مؤقتًا فارغًا أو ضع رابطًا تقديريًّا).
2. بعد نجاح النشر، انسخ الرابط الذي منحك إياه Vercel.
3. ضَع هذا الرابط في `NEXT_PUBLIC_SITE_URL` ثم نفّذ **Redeploy** من تبويب Deployments حتى يُبنى التطبيق بالقيمة الصحيحة.

---

## 5. بعد النشر

- افتح `https://<الرابط>/manifest.webmanifest` وتأكّد أنه يُرجع JSON صحيحًا (`lang: "ar"`, `dir: "rtl"`, `display: "standalone"`).
- تأكّد من تسجيل الـ service worker: يعمل في **الإنتاج فقط** (Production) وليس في `npm run dev`. افحصه من DevTools ▸ Application ▸ Service Workers.
- جرّب تسجيل الدخول بحساب مسؤول وتصفّح `/admin`.
- **سجّل الرابط النهائي في مكان معلوم** — سيحتاجه Capacitor في P2-2 عبر `server.url` (لا نشر منفصل للأندرويد).

---

## 6. ضبط Supabase Auth

الجلسة تعتمد على كوكيز، ويجب أن يعرف Supabase نطاق الإنتاج وإلا فشل تسجيل الدخول:

1. Supabase ▸ **Authentication ▸ URL Configuration**.
2. **Site URL**: ضع رابط Vercel الكامل (`https://your-app.vercel.app`).
3. **Redirect URLs**: أضِف `https://your-app.vercel.app/**` (وأي نطاق Preview تحتاجه).
4. احفظ، ثم أعِد اختبار تسجيل الدخول على رابط الإنتاج.

---

## 7. ملاحظة عن الـ APK

الـ APK لاحقًا مجرّد قوقعة (WebView) تشير إلى رابط Vercel هذا عبر `server.url` في `capacitor.config.ts`.
لا يوجد نشر منفصل للأندرويد ولا نسخة أوفلاين — كل تحديث على Vercel يصل تلقائيًّا إلى التطبيق المثبّت.
