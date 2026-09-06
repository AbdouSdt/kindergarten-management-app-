import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav, type NavItem } from "@/components/nav/sidebar-nav";

type AppShellProps = {
  title: string;
  navItems: NavItem[];
  userName: string | null;
  children: React.ReactNode;
};

export function AppShell({ title, navItems, userName, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-card hidden w-60 shrink-0 flex-col border-e p-4 md:flex">
        <Link href="/" className="px-3 py-2 text-base font-semibold">
          {title}
        </Link>
        <div className="mt-4 flex-1">
          <SidebarNav items={navItems} />
        </div>
        <div className="border-border space-y-2 border-t pt-4">
          <p className="text-muted-foreground px-3 text-xs">
            {userName ?? "مسجّل الدخول"}
          </p>
          <div className="px-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card flex items-center justify-between border-b px-6 py-3 md:hidden">
          <Link href="/" className="text-base font-semibold">
            {title}
          </Link>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
