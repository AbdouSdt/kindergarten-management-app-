import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav, type NavItem } from "@/components/nav/sidebar-nav";
import { InstallPromptButton } from "@/components/pwa/install-prompt-button";

type AppShellProps = {
  title: string;
  navItems: NavItem[];
  userName: string | null;
  children: React.ReactNode;
};

export function AppShell({ title, navItems, userName, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <aside className="border-border bg-card hidden w-60 shrink-0 flex-col border-e px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] md:flex">
        <Link
          href="/"
          className="flex min-h-[44px] items-center px-3 text-base font-semibold"
        >
          {title}
        </Link>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
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
        <header className="border-border bg-card flex items-center justify-between gap-2 border-b px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-0 items-center truncate text-base font-semibold"
          >
            {title}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <InstallPromptButton />
            <SignOutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
