# Changelog

Tagged checkpoints in git history. To go back to any version: `git checkout v1.0.0` (or `git diff v1.0.0 main` to see what changed since).

## v1.7.1 — 2026-08-27

- The Telegram link-code screen now copies `/link <code>` (not just the bare code) so it pastes straight into the chat with the bot.
- Palette deepened for real contrast: the original pastel colors failed WCAG AA against white card text (yellow was 1.53:1, needs 4.5:1) — recomputed from actual contrast ratios, not eyeballed. Small icon badges keep a separate lighter variant since they need the opposite direction (light icon on a dark tint).

## v1.7.0 — 2026-08-26

Telegram bot, as the iOS path instead of a native build (see ARCHITECTURE.md's distribution notes) — going Android-only for the app itself, with a Telegram bot covering the same logging for anyone on iOS.

- New `telegram-webhook` Edge Function: the bot itself. Menu-driven logging for every category (walk — with a start/stop timer, mirroring the app's — food, treats, medication, behavior, vaccines, vet visits), a `/today` summary per dog, and an undo button on every entry.
- Linking: generate a one-time code from the app's Household screen, send `/link <code>` to the bot once. No separate account for the bot — it writes as the same linked user.
- New `activity_log` table, populated by a trigger on every write to a log table, `dogs`, or `household_members` — covers both the app and the bot automatically (keyed off which Postgres role made the write), so there's now a durable history of who logged what and when, from either surface.
- `eas.json` added for building an installable Android APK directly (`eas build --platform android --profile preview`), bypassing the Play Store.

## v1.6.0 — 2026-08-26

Household sharing, so a second person can join and see the same dogs/timeline.

- The header's "Data" link moved to an icon next to the settings gear (top left); the user's avatar (initial-letter circle) now sits top right, tapping into a new Household screen with your info, the member list, and an invite code to share.
- The invite code is just the household's own id — copy it from the Household screen, and a new user enters it via a Create/Join toggle now on the household setup screen instead of always creating a fresh one.
- New `profiles` table (synced from `auth.users` via trigger) so household members can see each other's email — the API has no other way to read another user's account info.

## v1.5.0 — 2026-08-27

Settings screen (gear icon in the header) with Light / Dark / Match device theme choice, persisted across sessions. Dark variants applied throughout the app. The manual light/dark override only works natively (iOS/Android) — on web, NativeWind's dark mode ties to a real CSS media query the OS controls, which JS can't force.

## v1.4.2 — 2026-08-27

The v1.4.1 upload fix was itself wrong — turned out expo-file-system 57 dropped `readAsStringAsync` in favor of a new `File`/`Directory` class API (`new File(uri).arrayBuffer()`), which is what this project's own AGENTS.md warns about re-checking before writing Expo code. Also fixed the picker reopening right after picking a photo: the app's default 3x mutation retry was re-running the whole upload step (including the picker launch) on failure — the picker launch is no longer part of the retrying mutation.

## v1.4.1 — 2026-08-27

- Fixed avatar photo uploads: `fetch(fileUri).blob()` was silently uploading a bogus 14-byte "File not found" response instead of the real image (avatar showed blank everywhere after upload). Now reads the file via expo-file-system + base64 decoding, the reliable approach for local files in React Native.
- Removed the bottom-right FAB and category-picker sheet — redundant now that every dashboard card has its own "+" quick-add.

## v1.4.0 — 2026-08-27

Dashboard card visual redesign, per a reference screenshot.

- Cards are now solid-color rounded rectangles (previously white with a small colored icon circle).
- Added a "+" quick-add button directly on each card — jumps straight to that category's log form, skipping the picker sheet.
- Walk icon is now a dog silhouette instead of a generic walking-person figure.

## v1.3.0 — 2026-08-27

Data view improvements.

- Renamed "Reports" to "Data" in the header/link text.
- Added a Year time range (bucketed by month) alongside Day/Week/Month.
- Added a simple walk-minutes bar chart per range, hand-rolled with plain Views (no new dependency, stays Expo-Go compatible).

## v1.2.0 — 2026-08-27

Dashboard redesign.

- Replaced the flat chronological timeline with a per-category summary card dashboard: Walks, Food, Treats, Medication, Behavior (renamed from "vomit" for the dashboard only), and Vet.
- Vet card expands in place to show every vaccine (grouped by name) with up-to-date/expired/no-expiry status, plus last/upcoming visit dates.
- Tapping any other card opens a filtered history list for that category (new CategoryDetail screen), where entries are still tappable to edit.

## v1.1.0 — 2026-08-27

Dog avatars.

- Each dog can have a small circular avatar (shown above its name in the dog selector): a preset paw icon in one of 4 palette colors, or a real photo uploaded from the device, stored in a new Supabase Storage bucket.
- Falls back to the dog's initial letter in its assigned color when no avatar is set.

## v1.0.0 — 2026-08-26

Baseline: the full v1 feature set built so far.

- Supabase-backed monorepo (Expo/React Native app + shared data-access package), per `ARCHITECTURE.md`.
- Auth, household setup, multi-dog support.
- Logging for food, walks, treats, vomit/illness, medication, vaccines, vet appointments — with inline validation cues instead of silently-disabled buttons.
- Timeline with edit/delete on any entry (soft delete).
- Walk timer that survives navigating away and closing the app (persisted start timestamp, no background task needed).
- Simple day/week/month Reports dashboard.
- Warm visual identity using a user-provided 4-color palette, color-coded per log category.
