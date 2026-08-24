# K9log — Architecture & Build Plan

**Status:** v0.3 planning document
**Owners:** Mathias + wife
**App name:** K9log
**Build priorities:** solo-maintained, professional-grade, minimum ongoing tinkering, no early decisions that block a future stack migration.

## 1. What we're building

A Huckleberry-style tracker, but for dogs instead of babies. One or more dogs live under a household; anyone in the household can log day-to-day care and see a shared timeline. It starts as a private app for two people and one household, and is architected from day one so it can open up into a public, multi-household product without a rewrite.

Logging categories (v1 scope, from the original request):

1. **Food** — what was fed, how much, when.
2. **Walks** — start/stop timer or manual duration entry now; distance and GPS route mapping later.
3. **Treats** — type and (optionally) quantity.
4. **Vomit/illness events** — consistency, color, texture, suspected cause (e.g. "ate grass").
5. **Medicine & vaccines** — what was given/administered, dose, date, and (for vaccines) next-due date.
6. **Vet appointments** — schedule a future date, then log a summary after the visit.

## 2. Data model

Recommendation: **one table per log type**, not a single generic "event" table with a JSON blob. Separate tables keep each activity strongly typed (a vomit log's `consistency` field is a real enum column, not a loosely-typed JSON key), make reporting/analytics straightforward ("average walk duration this month"), and let each type evolve its fields independently. A unified timeline view is still easy — it's just a `UNION ALL` query (or an application-level merge) across the log tables, ordered by timestamp.

Core entities:

- **User** — id, email, password/OAuth identity, display name, created_at.
- **Household** — id, name, created_at. This is the multi-tenancy boundary (see §5).
- **HouseholdMember** — household_id, user_id, role (`owner` | `member`), invited_at, joined_at.
- **Dog** — id, household_id, name, breed, sex, birthdate, weight, photo_url, notes.

Log tables (all share: `id`, `dog_id`, `logged_by_user_id`, `occurred_at`, `created_at`, `notes`):

- **FoodLog** — food_name, food_type (dry/wet/raw/other), amount, unit (g/cups/oz).
- **WalkLog** — start_time, end_time, duration_seconds, distance_meters (nullable, future), route (nullable `LineString`, future — see §6), source (`timer` | `manual`).
- **TreatLog** — treat_name, quantity.
- **VomitLog** — consistency (enum: liquid/chunky/foamy/bile...), color, texture, suspected_cause (nullable free text or tag: "ate grass", "car sickness", "unknown"...), photo_url (nullable).
- **MedicationLog** — medication_name, dose, unit, is_recurring, recurrence_rule (nullable).
- **VaccineLog** — vaccine_name, administered_date, next_due_date, clinic_name, document_url (nullable).
- **VetAppointment** — scheduled_date, reason, status (`upcoming` | `completed` | `cancelled`), clinic_name, summary_notes (filled in after the visit), cost (nullable), follow_up_date (nullable).

Derived/support tables added as reminders/notifications get built:

- **Reminder** — dog_id, type (`vaccine_due`, `medication_due`, `vet_appointment`), due_at, related_log_id, status (`pending` | `sent` | `dismissed`).

Every log table's `dog_id` joins back to a `household_id` through `Dog`, so a single `WHERE household_id = :current` filter (enforced in the backend, not trusted to the client) scopes every query to the right household. Building this in from day one — even while it's just two users and one household — is the one decision that's expensive to retrofit later; see §5.

## 3. Tech stack

**Revised for solo maintenance** (superseding the earlier custom-NestJS-backend draft — see §4 for why): given no other developers are expected to join, and the explicit priority is minimum tinkering over maximum control, the backend recommendation shifts from "custom server on managed hosting" to **Supabase as the backend platform itself** — Postgres, Auth, Storage and Row Level Security, with small serverless Edge Functions for the handful of things that need real server-side logic. There is no standing server process for you to run, deploy, restart, or patch.

| Layer | Choice | Why |
|---|---|---|
| Mobile app | **React Native + Expo (TypeScript)** | One codebase for iOS + Android. Expo gives OTA JS updates, a managed build/submit pipeline (EAS), and painless access to camera/location/notifications later. |
| Navigation / forms | React Navigation, React Hook Form | Standard, well-supported RN choices. |
| UI kit | Tamagui or NativeWind (Tailwind-for-RN) | Consistent design system across iOS/Android from the start. |
| Server state | TanStack Query (React Query) | Caching, retries, offline-friendly sync for a mobile app with patchy connectivity. |
| Backend | **Supabase** (Postgres + Auth + Storage + Row Level Security) | No app server to run at all for standard reads/writes — the RN app talks to Postgres directly through Supabase's client library, and RLS policies (not hand-written middleware) enforce that a user can only see their own household's data. This is the single biggest lever for "works on its own without tinkering." |
| Custom server logic | **Supabase Edge Functions** (TypeScript/Deno, serverless) | For the handful of things that genuinely need a secure server context: dispatching push notifications, checking for possible-duplicate logs on sync, and later, payment webhooks. Each function scales to zero and needs no server to maintain — you deploy a function, not an app. |
| Database | **PostgreSQL** (Supabase-managed), plain SQL migrations | Same data model as before (§2) — nothing about the schema changes. Automated backups, point-in-time restore, and connection pooling are handled by Supabase. |
| Auth | **Supabase Auth** | Same provider as the database, so `auth.uid()` plugs directly into RLS policies — authorization lives in the database as a policy, not in code you have to remember to write correctly for every new feature. Scale numbers and migration path in §9. |
| File storage | **Supabase Storage** | Dog photos, vaccine documents — one fewer vendor than a separate S3/R2 bucket, same underlying object-storage model. |
| Push notifications | Expo push notification service, triggered from an Edge Function | Feeding reminders, vaccine due dates, vet appointment reminders. |
| Background walk timer | Local RN state + `expo-task-manager` (foreground); `expo-location` background permission (future, for GPS) | Start simple: a foreground timer is enough for v1's "log a walk" feature. |
| Maps / GPS (future) | `expo-location`, `react-native-maps` or Mapbox, **PostGIS** extension (built into Supabase Postgres) | Add PostGIS when you start storing routes/distance — no separate database migration needed, the extension is already available. |
| Monitoring | Sentry (mobile app + Edge Functions) | Supabase manages infrastructure uptime; Sentry catches bugs in your own app/function code, which is the failure mode that's still yours. |
| CI/CD | GitHub Actions + EAS Build/Update + Supabase CLI (`supabase db push`, `supabase functions deploy`) | Lint/test/build on PR; migrations and functions deploy the same way the app does — one pipeline, not two. |
| Payments (later, for public launch) | RevenueCat (mobile subscriptions) or Stripe, verified in an Edge Function | Only needed once you monetize — no need to wire this up for v1. |

## 4. Backend: why the recommendation changed, and how it stays reversible

The earlier draft of this plan recommended a hand-rolled NestJS server on managed hosting (Railway/Render), reasoning that a custom backend would be easiest to eventually hand to other engineers. Given the actual priorities — solo maintainer, professional but low-tinkering, automate rather than babysit — that reasoning doesn't apply, and running an app server you don't strictly need is exactly the kind of ongoing tinkering to avoid. **Supabase-as-backend removes an entire category of upkeep**: no server process to restart after a crash, no OS or runtime patching, no capacity planning, no separate uptime alert for "is my API up" (there isn't a bespoke API to go down). What's left is genuinely close to "runs on its own":

- **Schema migrations** — still written by you, but as plain SQL files tracked in the repo and applied with one CLI command; nothing about this changes versus any other Postgres setup.
- **Edge Functions** — small, focused, and rarely touched once written; there's no framework or dependency tree to keep patched the way a full NestJS app has.
- **Security** — authorization is enforced by RLS policies at the database layer, which is arguably *more* reliable for a solo maintainer than remembering to add the right `WHERE household_id = ...` filter in every new backend route you'd otherwise write by hand.
- **Being on call** — still real (your app's own bugs can still break things), but there's no server-is-down 2am page, because there's no server.
- **Cost monitoring** — one bill (Supabase) instead of several (hosting + managed Postgres + auth provider), easier to watch as usage grows.

**Is this "professional"?** Yes — Supabase is Postgres, PostgREST, and GoTrue (all open source) run as a managed service; production apps at real scale run on it, and RLS-based authorization is a genuinely sound security model, not a shortcut. "Professional" here means reliable and well-architected, not "hand-built from scratch" — for a one-person team, managed-and-correct beats custom-and-fragile.

**Keeping this reversible** (so this isn't a hard-coded decision you regret later):

1. **The data is portable by default.** It's standard PostgreSQL underneath — `pg_dump`/`pg_restore` moves your entire database to any Postgres host at any time, Supabase or not. This is what actually protects you, more than any specific vendor choice.
2. **Auth isn't a dead end.** Supabase Auth (GoTrue) is open source and self-hostable — if you ever leave Supabase-the-company but want to keep the same auth behavior, you can run GoTrue yourself against your own Postgres rather than rewriting login/signup from scratch.
3. **Wrap Supabase calls in one module, not scattered across screens.** Put every `supabase.from(...)` / `supabase.auth.*` call behind a thin data-access layer in `packages/shared` (see §6) rather than calling the Supabase client directly from every screen. If you ever migrate to a different backend, you rewrite that one module's internals — the screens don't change.
4. **Keep Edge Functions thin.** Business logic in plain TypeScript, with only a small glue layer calling Supabase-specific APIs — the logic itself ports to any Node/Deno-capable host.
5. **Go easy on deep, hard-to-replicate proprietary features** (e.g. intricate Realtime subscription logic) for anything load-bearing — fine as an enhancement, risky as a foundation.

If usage or complexity ever outgrows what Edge Functions comfortably do (long-running jobs, heavier third-party integrations, or — the one scenario where it starts to matter again — another developer actually joining), that's the point to introduce a real backend framework. Reach for **Fastify**, not NestJS, at that point: NestJS's structure is a team-coordination tool, and there's no team to coordinate for a solo project. Fastify is lighter to introduce later and lighter to maintain in the meantime.

## 5. Multi-tenancy: private now, public later

Build the household model in from day one, even though it's just the two of you:

- **v1 (private):** one household, two users, one or two dogs. No public sign-up screen — accounts created manually or via a simple invite you generate for yourselves.
- **v2 (small circle):** invite-by-link so a dog sitter or family member can join your household and log entries too. Push notification reminders. Refine the UI from real usage.
- **v3 (public launch prep):** self-serve sign-up, email verification, password reset flows (built into Supabase Auth), Terms of Service + Privacy Policy, App Store/Play Store listing, rate limiting and abuse protection, a support channel, basic product analytics (PostHog), and — if monetizing — subscription billing.
- **v4 (scale & new features):** GPS route tracking with PostGIS, breed-specific insights, data export, possibly vet-clinic integrations.

The reason to design multi-tenancy now rather than later: retrofitting household isolation onto a schema that assumed "one household forever" means a data migration with real user data on the line. Designing it in from the start costs almost nothing today (`household_id` foreign key everywhere) and avoids that entirely.

## 6. Suggested repo structure

No separate backend app to house — the "backend" is Supabase config plus a few small functions:

```
k9log/
  apps/
    mobile/          # Expo React Native app
  packages/
    shared/          # Data-access layer wrapping all Supabase calls, shared TS types + zod schemas
  supabase/
    migrations/      # Plain SQL schema migrations, applied via `supabase db push`
    functions/       # Edge Functions (push dispatch, duplicate-log check, future webhooks)
```

Tooling: pnpm workspaces if `packages/shared` grows enough to warrant it; not required for v1. The important discipline is keeping every Supabase call inside `packages/shared` (see §4, point 3) rather than in individual screens.

## 7. High-level architecture

```
[ React Native app (Expo) ]
        |  HTTPS, via packages/shared data-access layer
        v
[ Supabase: Postgres + Auth + Storage + RLS ] <-- household-scoped by policy, not by hand-written filters
        |
        |-- triggers / scheduled calls --> [ Edge Functions ] --> [ Expo Push Notification service ]
        |
[ Sentry watching the app + Edge Functions ]
```

No app server sits between the mobile app and the database — Supabase's client library talks to Postgres (via PostgREST) directly, with Row Level Security doing the authorization work a hand-written API layer would otherwise do.

## 8. Phased roadmap

| Phase | Scope |
|---|---|
| **1 — MVP (private)** | Household + dog setup, all 6 log types, shared timeline feed, offline write queue (see §9). No reminders, no GPS. |
| **2 — Quality of life** | Walk timer polish, push notification reminders (vaccine due, medication due, upcoming vet visit). |
| **3 — Household sharing** | Invite-by-link, roles, multi-user refinements based on real usage. |
| **4 — GPS & maps** | Distance tracking, route recording (PostGIS), map view of past walks. |
| **5 — Public launch** | Self-serve sign-up, App Store/Play Store submission, ToS/privacy policy, optional subscription billing, support channel. |

## 9. Decisions

### App name — resolved: K9log

Bundle IDs, the repo folder, and the App Store listing all follow this name.

### Backend framework — resolved: none for now

Given the solo-maintenance priority, §4 replaces the standalone backend entirely with Supabase + Edge Functions, so this question is deferred rather than answered outright. The analysis below still matters for *if* it ever comes up — either Edge Functions stop being enough, or another developer actually joins.

NestJS's cost is boilerplate: a simple CRUD feature needs a module, a controller, a service, and a DTO, where Express/Fastify would let you write one route handler. What that cost buys you — dependency injection (swap a database service for a mock in a test without rewriting the class that uses it), and built-in guards/pipes/interceptors/exception filters for auth, validation, and error handling that would otherwise be assembled from separate libraries one at a time — mostly pays off once a second or third engineer joins, because "how is this organized" has a documented, googleable answer instead of being a convention you invented under deadline.

Fastify is the more reasonable lighter option if you'd rather move fast for v1: strong TypeScript support, better raw performance than Express, and a real plugin ecosystem, without NestJS's file-per-concept ceremony. The risk with either lighter option is organizational drift — without an enforced structure, route handlers tend to accumulate business logic directly, which is fine at small scale but gets expensive to untangle later if the app grows into needing the separation NestJS gives you for free. Moving Fastify/Express logic into a NestJS-style structure later is a real but bounded refactor (the business logic mostly transplants; the surrounding structure is what gets rewritten) — the reverse essentially never happens. Express itself is the most common of the three, with the most tutorials and Stack Overflow answers, but it's the oldest API (callback-style error handling unless you add an async wrapper) and the slowest at the margin — reasonable if familiarity matters most, but Fastify is a strictly newer take on the same "thin, unopinionated" idea.

### Auth — resolved: Supabase Auth

Chosen over Clerk specifically because the backend is now Supabase-first (§4): using Supabase Auth means `auth.uid()` plugs directly into Row Level Security policies, so household-scoped authorization is one policy per table instead of code in a separate auth provider's SDK plus a separate backend that has to check it correctly every time. Scale and migration numbers below still apply.

As of Supabase's current pricing (checked August 2026): the **free tier** includes 50,000 monthly active users and up to 2 active projects at $0/month, with the caveat that a free project pauses after a week of inactivity (irrelevant once anyone is using it regularly — only a concern if the app goes quiet for a week during early private testing). The **Pro tier** ($25/month and up) includes 100,000 MAU, then $0.00325 per additional MAU, never pauses, and adds daily backups. In practice: 50,000 MAU free is far beyond a two-person household and comfortably covers a genuine public launch — $25/month is the realistic number to plan for once you want guaranteed uptime rather than pause-on-inactivity, independent of user count. (Source: [supabase.com/pricing](https://supabase.com/pricing).)

On migration: Supabase Auth's user table lives inside the same Postgres project as your app data, so moving away from it later is an identity/session migration, not a data migration — dogs, logs, and households don't move. The friction is credentials: Supabase hashes passwords with bcrypt, and most alternative providers (Clerk included) support bulk-importing users with a pre-computed password hash rather than forcing a reset for everyone — though the exact supported hash formats are worth checking against that provider's current docs at migration time, since import APIs change. Worst case, if a target provider doesn't support hash import, the fallback is a one-time forced password reset email — an inconvenience, not data loss. Net: Supabase Auth is a low-regret starting choice; a later migration is bounded to "move identities," not "rebuild the app."

### Offline support & sync conflicts — recommended approach

Worth building into v1 given how often "log a walk" happens somewhere with no signal. It's more tractable than it first sounds, because almost every log in this data model is an *insert* (a new event), not an edit to shared state — you logging a walk offline and your wife logging dinner online never conflicts; they're different rows. Two failure modes are worth a deliberate answer:

- **True duplicate logging** (you both log the same walk, unaware the other already did): this can't be prevented outright — the system has no way to know two rows describe the same real-world event without asking a person. The practical answer is to surface it, not auto-merge: when a device syncs a new log, check for another log of the same type on the same dog within a short window (say 15 minutes) created by a different user, and flag it ("Sarah also logged a walk at 3:02pm — same one?") so it's resolved in two taps instead of silently guessed.
- **Genuine edit/delete conflicts** (you edit a walk's duration offline while your wife deletes that same walk online): rarer, but worth a fixed rule. Recommended: (1) generate each log's ID on the device at creation time (a UUID), so an offline-created row already has a stable identity and syncing later is just an idempotent insert — no ID-collision risk between two devices; (2) treat deletes as soft-deletes (a `deleted_at` timestamp) rather than hard deletes, so a delete/edit race is reversible instead of silently destructive; (3) for direct edits to the same row, last-write-wins by server timestamp is a fine default — these are pet-care notes, not financial records, so an occasionally overwritten edit is a low-stakes failure mode, not one worth building real conflict-resolution UI for at this scale.

Mechanically: the mobile app needs a local write queue (TanStack Query's offline mutation support, or a lightweight local SQLite table of pending log entries) that replays queued writes in creation order once connectivity returns, rather than holding a full offline replica of the household's data.
