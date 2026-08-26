import type { SupabaseClient } from '../supabaseClient';

// Uploads a dog's avatar photo and returns its public URL. Path is keyed by
// dogId (see 0003_dog_photos_storage.sql's RLS policies), and the filename
// is randomized so a repeated upload doesn't collide with a cached copy of
// the previous one under the same URL.
export async function uploadDogPhoto(
  client: SupabaseClient,
  dogId: string,
  fileUri: string,
  contentType = 'image/jpeg'
): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const path = `${dogId}/${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from('dog-photos')
    .upload(path, blob, { contentType, upsert: true });
  if (error) throw error;

  const { data } = client.storage.from('dog-photos').getPublicUrl(path);
  return data.publicUrl;
}
