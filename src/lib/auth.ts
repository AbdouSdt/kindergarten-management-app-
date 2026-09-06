/**
 * Server-side auth helpers. Use inside Server Components, Route Handlers and
 * Server Actions to load the current user together with their profile / role.
 */
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

/** Landing page for each role. */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    default:
      return "/parent";
  }
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/** Require a logged-in user. Redirects to /login otherwise. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Assert the caller is an admin from inside a Server Action. Throws instead of
 * redirecting so the action can return a structured error to the client.
 */
export async function assertAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return profile;
}

/**
 * Assert the caller is staff (admin or teacher) from inside a Server Action.
 * Returns the profile so the caller can branch on role.
 */
export async function assertStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    throw new Error("Unauthorized");
  }
  return profile;
}

/** Classroom ids the given teacher is assigned to. Empty for non-teachers. */
export async function getTeacherClassroomIds(teacherId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classroom_teachers")
    .select("classroom_id")
    .eq("teacher_id", teacherId);
  return (data ?? []).map((r) => r.classroom_id);
}

/** Require a logged-in user with one of the given roles. */
export async function requireRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) {
    // Send users to their own home instead of showing a 403.
    redirect(homePathForRole(profile.role));
  }

  return profile;
}
