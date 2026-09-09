/** Supabase Storage helpers (server-side only). */
import { createClient } from "@/lib/supabase/server";

export const CHILD_PHOTOS_BUCKET = "child-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadResult = { url?: string; error?: string };

/**
 * Upload a child's photo to the public `child-photos` bucket and return its
 * public URL. Call from an admin-guarded Server Action; the storage RLS policy
 * only lets admins write.
 */
export async function uploadChildPhoto(
  childId: string,
  file: File,
): Promise<UploadResult> {
  if (!file || file.size === 0) return { error: "لم يتم اختيار صورة." };
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "حجم الصورة يتجاوز 5 ميغابايت." };
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return { error: "الصيغة غير مدعومة (JPG أو PNG أو WEBP فقط)." };
  }

  const ext =
    (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${childId}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(CHILD_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) return { error: error.message };

  const { data } = supabase.storage
    .from(CHILD_PHOTOS_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Turn a public `child-photos` URL (as produced by `uploadChildPhoto`) back
 * into its storage object path, e.g.
 *   https://<proj>.supabase.co/storage/v1/object/public/child-photos/<id>/<ts>.jpg
 *   -> "<id>/<ts>.jpg"
 * Returns null when the URL is empty or not a child-photos object URL.
 */
export function childPhotoPathFromUrl(
  photoUrl: string | null | undefined,
): string | null {
  if (!photoUrl) return null;
  const marker = `/storage/v1/object/public/${CHILD_PHOTOS_BUCKET}/`;
  const idx = photoUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = photoUrl.slice(idx + marker.length).split("?")[0];
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Best-effort removal of a child's photo object from the `child-photos` bucket,
 * given its public URL. Never throws and never reports failure: the `children`
 * row is the source of truth, and a leftover object is only cosmetic. Call from
 * an admin-guarded Server Action after the DB mutation has been decided.
 */
export async function deleteChildPhoto(
  photoUrl: string | null | undefined,
): Promise<void> {
  const path = childPhotoPathFromUrl(photoUrl);
  if (!path) return;
  try {
    const supabase = await createClient();
    await supabase.storage.from(CHILD_PHOTOS_BUCKET).remove([path]);
  } catch {
    // Swallow: storage cleanup must not fail the surrounding action.
  }
}
