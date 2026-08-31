import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — hanya dipakai di server (backend), jangan expose ke client
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const PHOTO_BUCKET = 'plant-photos';

/**
 * Upload foto tanaman ke Supabase Storage
 * @param file - Buffer file gambar
 * @param filename - Nama file unik
 * @param mimeType - Tipe MIME (image/jpeg, image/png, dll.)
 * @returns URL publik foto
 */
export async function uploadPlantPhoto(
  file: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(filename, file, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Hapus foto tanaman dari Supabase Storage
 * @param photoUrl - URL publik foto yang akan dihapus
 */
export async function deletePlantPhoto(photoUrl: string): Promise<void> {
  try {
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split(`/${PHOTO_BUCKET}/`);
    if (pathParts.length < 2) return;

    const filePath = pathParts[1];
    await supabase.storage.from(PHOTO_BUCKET).remove([filePath]);
  } catch {
    // Tidak throw error jika gagal hapus foto (non-critical)
    console.warn('Gagal menghapus foto dari storage:', photoUrl);
  }
}
