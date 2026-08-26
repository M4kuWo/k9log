// Field specs for the log kinds that reduce to "collect N text answers, then
// insert a row" — everything except walk (which has the start/stop timer
// special case, handled directly in index.ts).

export type FlowKind =
  | 'food'
  | 'treat'
  | 'medication'
  | 'vomit'
  | 'vaccine'
  | 'vet_appointment'
  | 'walk_manual';

type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };

export type FieldSpec = {
  key: string;
  prompt: string;
  parse: (input: string) => ParseResult;
};

function textField(key: string, prompt: string, optional = false): FieldSpec {
  return {
    key,
    prompt,
    parse: (input) => {
      const trimmed = input.trim();
      if (optional && trimmed === '-') return { ok: true, value: null };
      if (!trimmed) {
        return { ok: false, error: optional ? "Send something, or '-' to skip." : "That can't be empty." };
      }
      return { ok: true, value: trimmed };
    },
  };
}

function dateField(key: string, prompt: string): FieldSpec {
  return {
    key,
    prompt,
    parse: (input) => {
      const trimmed = input.trim().toLowerCase();
      if (trimmed === 'today') return { ok: true, value: new Date().toISOString().slice(0, 10) };
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { ok: true, value: trimmed };
      return { ok: false, error: "Use YYYY-MM-DD, or send 'today'." };
    },
  };
}

function minutesField(key: string, prompt: string): FieldSpec {
  return {
    key,
    prompt,
    parse: (input) => {
      const n = Number(input.trim());
      if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Send a number of minutes, like 20.' };
      return { ok: true, value: n };
    },
  };
}

export type Flow = {
  table: string;
  fields: FieldSpec[];
  build: (dogId: string, collected: Record<string, unknown>) => Record<string, unknown>;
  summarize: (collected: Record<string, unknown>) => string;
};

export const FLOWS: Record<FlowKind, Flow> = {
  food: {
    table: 'food_logs',
    fields: [textField('food_name', 'What did they eat?')],
    build: (dog_id, f) => ({ dog_id, food_name: f.food_name }),
    summarize: (f) => `🍖 Fed ${f.food_name}`,
  },
  treat: {
    table: 'treat_logs',
    fields: [textField('treat_name', 'Treat?')],
    build: (dog_id, f) => ({ dog_id, treat_name: f.treat_name }),
    summarize: (f) => `🦴 Treat: ${f.treat_name}`,
  },
  medication: {
    table: 'medication_logs',
    fields: [textField('medication_name', 'Which medication?')],
    build: (dog_id, f) => ({ dog_id, medication_name: f.medication_name, is_recurring: false }),
    summarize: (f) => `💊 Medication: ${f.medication_name}`,
  },
  vomit: {
    table: 'vomit_logs',
    fields: [textField('notes', "Anything to note? (or send '-' to skip)", true)],
    build: (dog_id, f) => ({ dog_id, notes: f.notes ?? null }),
    summarize: (f) => (f.notes ? `🩺 Behavior noted: ${f.notes}` : '🩺 Behavior noted'),
  },
  vaccine: {
    table: 'vaccine_logs',
    fields: [
      textField('vaccine_name', 'Vaccine name?'),
      dateField('administered_date', "Date given? (YYYY-MM-DD or 'today')"),
    ],
    build: (dog_id, f) => ({
      dog_id,
      vaccine_name: f.vaccine_name,
      administered_date: f.administered_date,
    }),
    summarize: (f) => `💉 Vaccine: ${f.vaccine_name} (${f.administered_date})`,
  },
  vet_appointment: {
    table: 'vet_appointments',
    fields: [textField('reason', "Reason for the visit? (or '-' to skip)", true)],
    build: (dog_id, f) => ({
      dog_id,
      reason: f.reason ?? null,
      scheduled_date: new Date().toISOString(),
      status: 'completed',
    }),
    summarize: (f) => (f.reason ? `🏥 Vet visit: ${f.reason}` : '🏥 Vet visit logged'),
  },
  walk_manual: {
    table: 'walk_logs',
    fields: [minutesField('minutes', 'How many minutes?')],
    build: (dog_id, f) => ({
      dog_id,
      start_time: new Date().toISOString(),
      end_time: null,
      duration_seconds: (f.minutes as number) * 60,
      source: 'manual',
    }),
    summarize: (f) => `🚶 Walk: ${f.minutes} min`,
  },
};

// Telegram callback_data is capped at 64 bytes, so undo buttons reference
// the table by a short code rather than its full name.
export const TABLE_CODES: Record<string, string> = {
  food_logs: 'f',
  walk_logs: 'w',
  treat_logs: 't',
  vomit_logs: 'v',
  medication_logs: 'm',
  vaccine_logs: 'c',
  vet_appointments: 'a',
};

export const TABLE_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(TABLE_CODES).map(([table, code]) => [code, table])
);
