import * as FileSystem from 'expo-file-system';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import type { SupabaseClient } from '../supabaseClient';

// Uploads a dog's avatar photo and returns its public URL. Path is keyed by
// dogId (see 0003_dog_photos_storage.sql's RLS policies), and the filename
// is randomized so a repeated upload doesn't collide with a cached copy of
// the previous one under the same URL.
//
// Reads the file via expo-file-system rather than `fetch(uri).blob()` —
// fetching a local file:// (or content://) URI directly is unreliable in
// React Native and can silently resolve to a bogus tiny response instead of
// the actual file, which is exactly what happened before this fix (a
// 14-byte "File not found" text body got uploaded as if it were the photo).
export async function uploadDogPhoto(
  client: SupabaseClient,
  dogId: string,
  fileUri: string,
  contentType = 'image/jpeg'
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const path = `${dogId}/${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from('dog-photos')
    .upload(path, decodeBase64(base64), { contentType, upsert: true });
  if (error) throw error;

  const { data } = client.storage.from('dog-photos').getPublicUrl(path);
  return data.publicUrl;
}
