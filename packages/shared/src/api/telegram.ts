import type { SupabaseClient } from '../supabaseClient';
import { TelegramLinkSchema, type TelegramLink } from '../types';

const LINK_CODE_TTL_MS = 10 * 60 * 1000;

function randomLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// A 6-digit code, valid for 10 minutes, that the Telegram bot exchanges for
// a chat_id -> user_id link (see supabase/functions/telegram-webhook). At
// this scale (a couple of codes ever, per household) a random code with no
// collision retry is fine — the `code` primary key would just reject a
// clash and the caller can ask the user to try again.
export async function createTelegramLinkCode(
  client: SupabaseClient,
  userId: string,
  householdId: string
): Promise<{ code: string; expiresAt: string }> {
  const code = randomLinkCode();
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS).toISOString();
  const { error } = await client.from('telegram_link_codes').insert({
    code,
    user_id: userId,
    household_id: householdId,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { code, expiresAt };
}

export async function getMyTelegramLink(client: SupabaseClient): Promise<TelegramLink | null> {
  const { data, error } = await client.from('telegram_links').select('*').maybeSingle();
  if (error) throw error;
  return data ? TelegramLinkSchema.parse(data) : null;
}

export async function unlinkTelegram(client: SupabaseClient, chatId: number): Promise<void> {
  const { error } = await client.from('telegram_links').delete().eq('chat_id', chatId);
  if (error) throw error;
}
