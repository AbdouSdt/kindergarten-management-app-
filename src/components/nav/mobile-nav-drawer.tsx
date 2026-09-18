"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav, type NavItem } from "@/components/nav/sidebar-nav";

type MobileNavDrawerProps = {
  title: string;
  navItems: NavItem[];
  userName: string | null;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Hamburger button + navigation drawer for phone widths (< md). The drawer
 * slides in from the inline-start edge (right in RTL), closes on backdrop click,
 * Escape, link click and route change, and locks body scroll while open.
 */
export function MobileNavDrawer({
  title,
  navItems,
  userName,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  // Remember the path the drawer was opened on: a route change closes it
  // without needing an effect that sets state.
  const [openPath, setOpenPath] = useState<string | null>(null);
  // Drop a stale path (e.g. the drawer was open when back navigation changed
  // the route) so returning to that path later cannot reopen it.
  if (openPath !== null && openPath !== pathname) {
    setOpenPath(null);
  }
  const open = openPath === pathname;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenPath(null), []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const button = buttonRef.current;

    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    (focusables()[0] ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // The drawer is phone-only: if the viewport grows to md+, drop it.
    const mq = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };
    mq.addEventListener("change", onBreakpoint);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = previousOverflow;
      button?.focus();
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpenPath(pathname)}
        aria-label="القائمة"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="text-foreground hover:bg-muted -ms-2 flex size-11 shrink-0 items-center justify-center rounded-md md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="القائمة"
            tabIndex={-1}
            // Physical notch insets on both sides: the panel sits outside <body> padding.
            style={{
              paddingLeft: "max(1rem, env(safe-area-inset-left))",
              paddingRight: "max(1rem, env(safe-area-inset-right))",
            }}
            className="bg-card border-border drawer-panel absolute inset-y-0 start-0 z-10 flex w-72 max-w-[85vw] flex-col overflow-hidden border-e pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-xl outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                onClick={close}
                className="flex min-h-[44px] min-w-0 items-center truncate px-3 text-base font-semibold"
              >
                {title}
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="إغلاق"
                className="text-muted-foreground hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-md text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              <SidebarNav items={navItems} onNavigate={close} />
            </div>
            <div className="border-border space-y-2 border-t pt-4">
              <p className="text-muted-foreground px-3 text-xs">
                {userName ?? "مسجّل الدخول"}
              </p>
              <div className="px-3">
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
