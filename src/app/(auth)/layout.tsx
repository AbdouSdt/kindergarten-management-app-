import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center text-lg font-semibold">
          إدارة الحضانة
        </Link>
        <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
