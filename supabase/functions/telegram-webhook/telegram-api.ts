const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set');
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export type InlineButton = { text: string; data: string };

export function keyboard(rows: InlineButton[][]) {
  return { inline_keyboard: rows.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) };
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
  });
}

export async function answerCallbackQuery(id: string, text?: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text }),
  });
}

export type TelegramUpdate = {
  message?: { chat: { id: number }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    message: { chat: { id: number }; message_id: number };
  };
};
