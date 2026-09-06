import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground">
        الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Link href="/" className="text-primary font-medium hover:underline">
        العودة إلى الرئيسية
      </Link>
    </main>
  );
}
