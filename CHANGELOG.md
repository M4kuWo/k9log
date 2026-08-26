# Changelog

Tagged checkpoints in git history. To go back to any version: `git checkout v1.0.0` (or `git diff v1.0.0 main` to see what changed since).

## v1.0.0 — 2026-08-26

Baseline: the full v1 feature set built so far.

- Supabase-backed monorepo (Expo/React Native app + shared data-access package), per `ARCHITECTURE.md`.
- Auth, household setup, multi-dog support.
- Logging for food, walks, treats, vomit/illness, medication, vaccines, vet appointments — with inline validation cues instead of silently-disabled buttons.
- Timeline with edit/delete on any entry (soft delete).
- Walk timer that survives navigating away and closing the app (persisted start timestamp, no background task needed).
- Simple day/week/month Reports dashboard.
- Warm visual identity using a user-provided 4-color palette, color-coded per log category.
