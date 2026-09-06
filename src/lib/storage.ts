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
