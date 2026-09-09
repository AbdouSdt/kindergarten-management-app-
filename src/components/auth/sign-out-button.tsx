"use client";

export function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-[44px] items-center text-sm font-medium"
      >
        تسجيل الخروج
      </button>
    </form>
  );
}
