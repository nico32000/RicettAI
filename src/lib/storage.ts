import { createClient } from "@supabase/supabase-js";

// Client con service role per operazioni server-side
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client pubblico per upload client-side
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "ricettai-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload una foto sul bucket Supabase Storage (lato server con service role).
 * Restituisce l'URL pubblico.
 */
export async function uploadPhoto(
  file: File,
  userId: string,
  cookedInstanceId: string,
  index: number
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File troppo grande (max 5MB): ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Formato non supportato. Usa JPG, PNG o WebP.`);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  // Path: users/{userId}/cooked/{instanceId}/{index}.{ext}
  const path = `users/${userId}/cooked/${cookedInstanceId}/${index}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(`Upload fallito: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

/**
 * Elimina foto da storage (es. se l'utente cancella il cucinato)
 */
export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) console.error("Delete photo error:", error.message);
}

/**
 * Setup bucket (da eseguire una volta in seed o script di setup)
 */
export async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    console.log(`✅ Bucket "${BUCKET}" creato`);
  }
}
