# Changelog

Tagged checkpoints in git history. To go back to any version: `git checkout v1.0.0` (or `git diff v1.0.0 main` to see what changed since).

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
