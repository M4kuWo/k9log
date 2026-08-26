// Telegram bot for K9log, so a household member without a native app build
// (see CHANGELOG v1.7.0) can still log everything the app does. Runs as a
// webhook target: Telegram POSTs an Update here on every message/button tap.
//
// Uses the service role key, so it bypasses RLS entirely — authorization is
// done in code by scoping every query to the household the chat_id is
// linked to (see telegram_links, populated via /link <code>). Writes still
// land in activity_log like any other write (see 0005_telegram_and_activity_log.sql)
// since that trigger fires regardless of which role wrote the row.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendMessage, answerCallbackQuery, keyboard, chunk, type TelegramUpdate } from './telegram-api.ts';
import { FLOWS, TABLE_BY_CODE, TABLE_CODES, type FlowKind } from './flows.ts';

const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Link = { chat_id: number; user_id: string; household_id: string };

type SessionState =
  | { step: 'idle' }
  | { step: 'select_dog'; kind: FlowKind | 'walk' }
  | { step: 'walk_menu'; dogId: string }
  | { step: 'walk_timer_running'; dogId: string; startedAt: string }
  | { step: 'collecting'; kind: FlowKind; dogId: string; fieldIndex: number; collected: Record<string, unknown> };

const ALL_LOG_TABLES = [
  'food_logs',
  'walk_logs',
  'treat_logs',
  'vomit_logs',
  'medication_logs',
  'vaccine_logs',
  'vet_appointments',
];

// ── session & link storage ──────────────────────────────────────────────

async function getLink(chatId: number): Promise<Link | null> {
  const { data } = await supabase.from('telegram_links').select('*').eq('chat_id', chatId).maybeSingle();
  return data;
}

async function getSession(chatId: number): Promise<SessionState> {
  const { data } = await supabase.from('telegram_sessions').select('state').eq('chat_id', chatId).maybeSingle();
  return (data?.state as SessionState) ?? { step: 'idle' };
}

async function setSession(chatId: number, state: SessionState) {
  await supabase.from('telegram_sessions').upsert({ chat_id: chatId, state, updated_at: new Date().toISOString() });
}

const clearSession = (chatId: number) => setSession(chatId, { step: 'idle' });

async function getDogs(householdId: string): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from('dogs')
    .select('id, name')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

// ── menus ────────────────────────────────────────────────────────────────

async function sendMainMenu(chatId: number) {
  await sendMessage(
    chatId,
    'What would you like to log?',
    keyboard([
      [{ text: '🚶 Walk', data: 'menu:walk' }, { text: '🍖 Food', data: 'menu:food' }],
      [{ text: '🦴 Treat', data: 'menu:treat' }, { text: '💊 Medication', data: 'menu:medication' }],
      [{ text: '🩺 Behavior', data: 'menu:vomit' }, { text: '📅 Vet & Vaccines', data: 'menu:vetmenu' }],
      [{ text: '📊 Today', data: 'menu:today' }, { text: '⚙️ More', data: 'menu:more' }],
    ])
  );
}

async function startFlow(chatId: number, link: Link, kind: FlowKind | 'walk') {
  const dogs = await getDogs(link.household_id);
  if (dogs.length === 0) {
    await sendMessage(chatId, 'No dogs set up yet — add one in the app first.');
    return;
  }
  if (dogs.length === 1) {
    await onDogPicked(chatId, kind, dogs[0].id);
    return;
  }
  await setSession(chatId, { step: 'select_dog', kind });
  await sendMessage(
    chatId,
    'Which dog?',
    keyboard(chunk(dogs.map((d) => ({ text: d.name, data: `dog:pick:${d.id}` })), 2))
  );
}

async function onDogPicked(chatId: number, kind: FlowKind | 'walk', dogId: string) {
  if (kind === 'walk') {
    await setSession(chatId, { step: 'walk_menu', dogId });
    await sendMessage(
      chatId,
      'Walk:',
      keyboard([[{ text: '⏱ Start timer', data: 'walk:start' }, { text: '✍️ Log manual', data: 'walk:manual' }]])
    );
    return;
  }
  await beginCollecting(chatId, kind, dogId);
}

async function beginCollecting(chatId: number, kind: FlowKind, dogId: string) {
  const flow = FLOWS[kind];
  await setSession(chatId, { step: 'collecting', kind, dogId, fieldIndex: 0, collected: {} });
  await sendMessage(chatId, flow.fields[0].prompt);
}

async function handleFieldInput(chatId: number, session: Extract<SessionState, { step: 'collecting' }>, text: string) {
  const flow = FLOWS[session.kind];
  const field = flow.fields[session.fieldIndex];
  const result = field.parse(text);
  if (!result.ok) {
    await sendMessage(chatId, result.error);
    return;
  }

  const collected = { ...session.collected, [field.key]: result.value };
  const nextIndex = session.fieldIndex + 1;

  if (nextIndex < flow.fields.length) {
    await setSession(chatId, { ...session, fieldIndex: nextIndex, collected });
    await sendMessage(chatId, flow.fields[nextIndex].prompt);
    return;
  }

  await clearSession(chatId);
  const payload = flow.build(session.dogId, collected);
  const { data, error } = await supabase.from(flow.table).insert(payload).select('id').single();
  if (error || !data) {
    await sendMessage(chatId, `Couldn't save that: ${error?.message ?? 'unknown error'}`);
    return;
  }

  await sendMessage(chatId, `✅ ${flow.summarize(collected)}`, keyboard([
    [{ text: '↩️ Undo', data: `undo:${TABLE_CODES[flow.table]}:${data.id}` }],
  ]));
}

async function handleWalkAction(chatId: number, session: SessionState, action: string) {
  if (action === 'start') {
    if (session.step !== 'walk_menu') return;
    await setSession(chatId, { step: 'walk_timer_running', dogId: session.dogId, startedAt: new Date().toISOString() });
    await sendMessage(chatId, "⏱ Timer started. Tap Stop when you're back.", keyboard([[{ text: '⏹ Stop', data: 'walk:stop' }]]));
    return;
  }

  if (action === 'manual') {
    if (session.step !== 'walk_menu') return;
    await beginCollecting(chatId, 'walk_manual', session.dogId);
    return;
  }

  if (action === 'stop') {
    if (session.step !== 'walk_timer_running') {
      await sendMessage(chatId, 'No walk timer running — send /menu to start one.');
      return;
    }
    await clearSession(chatId);
    const start = new Date(session.startedAt);
    const durationSeconds = Math.max(1, Math.round((Date.now() - start.getTime()) / 1000));
    const { data, error } = await supabase
      .from('walk_logs')
      .insert({
        dog_id: session.dogId,
        start_time: session.startedAt,
        end_time: new Date().toISOString(),
        duration_seconds: durationSeconds,
        source: 'timer',
      })
      .select('id')
      .single();
    if (error || !data) {
      await sendMessage(chatId, `Couldn't save that: ${error?.message ?? 'unknown error'}`);
      return;
    }
    const minutes = Math.round(durationSeconds / 60);
    await sendMessage(chatId, `✅ 🚶 Walk: ${minutes} min`, keyboard([
      [{ text: '↩️ Undo', data: `undo:${TABLE_CODES['walk_logs']}:${data.id}` }],
    ]));
  }
}

async function sendTodaySummary(chatId: number, link: Link) {
  const dogs = await getDogs(link.household_id);
  if (dogs.length === 0) {
    await sendMessage(chatId, 'No dogs set up yet.');
    return;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const since = startOfDay.toISOString();

  const lines: string[] = [];
  for (const dog of dogs) {
    const [walks, food, treats, meds, vomit] = await Promise.all([
      supabase.from('walk_logs').select('duration_seconds').eq('dog_id', dog.id).is('deleted_at', null).gte('occurred_at', since),
      supabase.from('food_logs').select('id').eq('dog_id', dog.id).is('deleted_at', null).gte('occurred_at', since),
      supabase.from('treat_logs').select('id').eq('dog_id', dog.id).is('deleted_at', null).gte('occurred_at', since),
      supabase.from('medication_logs').select('id').eq('dog_id', dog.id).is('deleted_at', null).gte('occurred_at', since),
      supabase.from('vomit_logs').select('id').eq('dog_id', dog.id).is('deleted_at', null).gte('occurred_at', since),
    ]);
    const walkMinutes = Math.round(
      (walks.data ?? []).reduce((sum, w) => sum + (w.duration_seconds ?? 0), 0) / 60
    );
    lines.push(
      `🐕 ${dog.name}`,
      `🚶 ${walks.data?.length ?? 0} walk(s), ${walkMinutes} min`,
      `🍖 ${food.data?.length ?? 0} meal(s)`,
      `🦴 ${treats.data?.length ?? 0} treat(s)`,
      `💊 ${meds.data?.length ?? 0} dose(s)`,
      `🩺 ${vomit.data?.length ?? 0} note(s)`,
      ''
    );
  }

  await sendMessage(chatId, lines.join('\n').trim());
}

async function undoLast(chatId: number, link: Link) {
  const candidates = await Promise.all(
    ALL_LOG_TABLES.map(async (table) => {
      const { data } = await supabase
        .from(table)
        .select('id, occurred_at')
        .eq('logged_by_user_id', link.user_id)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ? { table, id: data.id as string, occurred_at: data.occurred_at as string } : null;
    })
  );

  const latest = candidates
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1))[0];

  if (!latest) {
    await sendMessage(chatId, 'Nothing to undo.');
    return;
  }

  await supabase.from(latest.table).update({ deleted_at: new Date().toISOString() }).eq('id', latest.id);
  await sendMessage(chatId, '↩️ Undone.');
}

async function sendHouseholdInfo(chatId: number, link: Link) {
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', link.household_id);

  const ids = (members ?? []).map((m) => m.user_id as string);
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, email').in('id', ids)
    : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const lines = (members ?? []).map((m) => `${emailById.get(m.user_id) ?? m.user_id} — ${m.role}`);
  await sendMessage(chatId, lines.join('\n') || 'No members found.');
}

// ── link code exchange ──────────────────────────────────────────────────

async function handleLink(chatId: number, text: string) {
  const code = text.replace(/^\/link/i, '').trim();
  if (!code) {
    await sendMessage(chatId, 'Send /link followed by the code shown in the app, e.g. /link 482913');
    return;
  }

  const { data: row } = await supabase.from('telegram_link_codes').select('*').eq('code', code).maybeSingle();
  if (!row || new Date(row.expires_at) < new Date()) {
    await sendMessage(chatId, "That code isn't valid or has expired — generate a new one in the app's Household screen.");
    return;
  }

  await supabase
    .from('telegram_links')
    .upsert({ chat_id: chatId, user_id: row.user_id, household_id: row.household_id });
  await supabase.from('telegram_link_codes').delete().eq('code', code);

  await sendMessage(chatId, "You're linked! Send /menu to get started.");
}

// ── message & callback routing ──────────────────────────────────────────

async function handleMessage(chatId: number, text: string) {
  const trimmed = text.trim();
  const link = await getLink(chatId);

  if (!link) {
    if (trimmed.toLowerCase().startsWith('/link')) {
      await handleLink(chatId, trimmed);
    } else {
      await sendMessage(
        chatId,
        "Hi! I'm the K9log bot. Get a link code from the app's Household screen, then send /link <code>."
      );
    }
    return;
  }

  if (trimmed === '/start' || trimmed === '/menu') {
    await clearSession(chatId);
    await sendMainMenu(chatId);
    return;
  }

  if (trimmed === '/today') {
    await sendTodaySummary(chatId, link);
    return;
  }

  const session = await getSession(chatId);
  if (session.step === 'collecting') {
    await handleFieldInput(chatId, session, trimmed);
    return;
  }

  await sendMessage(chatId, 'Not sure what to do with that — send /menu to see your options.');
}

async function handleMenuTap(chatId: number, link: Link, action: string) {
  if (action === 'walk' || action === 'food' || action === 'treat' || action === 'medication' || action === 'vomit') {
    await startFlow(chatId, link, action);
    return;
  }
  if (action === 'vetmenu') {
    await sendMessage(
      chatId,
      'Vet & vaccines:',
      keyboard([[{ text: '💉 Vaccine', data: 'vetmenu:vaccine' }, { text: '🏥 Vet visit', data: 'vetmenu:vet' }]])
    );
    return;
  }
  if (action === 'today') {
    await sendTodaySummary(chatId, link);
    return;
  }
  if (action === 'more') {
    await sendMessage(
      chatId,
      'More:',
      keyboard([
        [{ text: '↩️ Undo last', data: 'more:undo' }],
        [{ text: '👥 Household', data: 'more:household' }],
        [{ text: '🔗 Manage link', data: 'more:link' }],
      ])
    );
  }
}

async function handleCallback(cq: NonNullable<TelegramUpdate['callback_query']>) {
  const chatId = cq.message.chat.id;
  const data = cq.data ?? '';
  await answerCallbackQuery(cq.id);

  const link = await getLink(chatId);
  if (!link) {
    await sendMessage(chatId, 'Send /link <code> first.');
    return;
  }

  const [ns, action, arg] = data.split(':');

  if (ns === 'menu') {
    await handleMenuTap(chatId, link, action);
  } else if (ns === 'dog' && action === 'pick') {
    const session = await getSession(chatId);
    if (session.step === 'select_dog') await onDogPicked(chatId, session.kind, arg);
  } else if (ns === 'walk') {
    const session = await getSession(chatId);
    await handleWalkAction(chatId, session, action);
  } else if (ns === 'vetmenu') {
    await startFlow(chatId, link, action === 'vet' ? 'vet_appointment' : 'vaccine');
  } else if (ns === 'more') {
    if (action === 'undo') await undoLast(chatId, link);
    else if (action === 'household') await sendHouseholdInfo(chatId, link);
    else if (action === 'link') await sendMessage(chatId, 'To unlink, open the app → your avatar → Household → Unlink.');
  } else if (ns === 'undo') {
    const table = TABLE_BY_CODE[action];
    if (table) {
      await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', arg);
      await sendMessage(chatId, '↩️ Undone.');
    }
  }
}

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }
  if (req.method !== 'POST') return new Response('ok');

  try {
    const update: TelegramUpdate = await req.json();
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message?.text) {
      await handleMessage(update.message.chat.id, update.message.text);
    }
  } catch (err) {
    console.error(err);
  }

  return new Response('ok');
});
