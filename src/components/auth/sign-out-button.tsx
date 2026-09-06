"use client";

export function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground text-sm font-medium"
      >
        تسجيل الخروج
      </button>
    </form>
  );
}
