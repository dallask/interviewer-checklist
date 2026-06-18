// src/storage/bootstrap.ts
// Async migration orchestrator — runs the full migration pipeline, validates
// with valibot, and returns hydrated V4 state before createRoot is called.
// Implements STORE-03. Never throws — all error paths return valid {manifest, sessions, failedSessionIds}.

import * as v from 'valibot';
import { storageAdapter } from './adapter.js';
import { runMigrations } from './migrations/index.js';
import { migrateV2ToV3 } from './migrations/v2-to-v3.js';
import { migrateV3ToV4 } from './migrations/v3-to-v4.js';
import type { V2Manifest, V4Session } from './types.js';
import {
  createDefaultManifest,
  createDefaultV4Session,
  V2ManifestSchema,
  V2SessionSchema,
  V3SessionSchema,
  V4SessionSchema,
} from './types.js';

/** Returns a fresh default state and writes it to storage. */
async function bootstrapDefaults(): Promise<{
  manifest: V2Manifest;
  sessions: Record<string, V4Session>;
  failedSessionIds: string[];
}> {
  const manifest = createDefaultManifest();
  const defaultSession = createDefaultV4Session(manifest.sessions[0].id);
  await chrome.storage.local.set({
    manifest,
    [`session:${manifest.sessions[0].id}`]: defaultSession,
  });
  return {
    manifest,
    sessions: { [manifest.sessions[0].id]: defaultSession },
    failedSessionIds: [],
  };
}

/**
 * Bootstraps the storage layer before the app mounts.
 *
 * Four scenarios handled:
 *   A) Empty storage (first run) — creates default V2Manifest + V4Session, writes both.
 *   B) Valid v2 manifest — validates with valibot, loads all sessions, migrates V3→V4,
 *      returns hydrated state with failedSessionIds for any sessions that failed migration.
 *   C) Legacy v1 data (version < 2 or non-numeric version) — runs runMigrations, writes
 *      migrated manifest+session.
 *   D) Corrupt/invalid data (fails V2ManifestSchema and is not v1) — writes
 *      recovery:timestamp key, bootstraps with default state.
 *
 * Contract: always returns a valid {manifest, sessions, failedSessionIds} object; never throws.
 */
export async function bootstrap(): Promise<{
  manifest: V2Manifest;
  sessions: Record<string, V4Session>;
  failedSessionIds: string[];
}> {
  // Step 1: Read the manifest key from chrome.storage.local
  const raw = await storageAdapter.read(['manifest']);
  const rawManifest = raw.manifest;

  // ---------------------------------------------------------------------------
  // Scenario A: First run — no manifest key in storage
  // ---------------------------------------------------------------------------
  if (!rawManifest) {
    return bootstrapDefaults();
  }

  // Extract the version field for routing decisions
  const version =
    typeof rawManifest === 'object' && rawManifest !== null
      ? (rawManifest as Record<string, unknown>).version
      : undefined;

  // ---------------------------------------------------------------------------
  // Scenario C: Legacy v1 data — version is a number < 2 (e.g., 1) or missing
  // Route to migration pipeline. Unknown high versions (99, etc.) are NOT v1 —
  // they fall through to valibot validation (Scenario D path).
  // ---------------------------------------------------------------------------
  if (typeof version === 'number' && version < 2) {
    try {
      const migrated = runMigrations(rawManifest);
      if (
        migrated !== null &&
        'manifest' in migrated &&
        'session' in migrated
      ) {
        const v3 = migrateV2ToV3(migrated.session);
        const v4 = migrateV3ToV4(v3);
        await chrome.storage.local.set({
          manifest: migrated.manifest,
          [`session:${v4.id}`]: v4,
        });
        return {
          manifest: migrated.manifest,
          sessions: { [v4.id]: v4 },
          failedSessionIds: [],
        };
      }
    } catch (err) {
      console.error(
        '[bootstrap] v1 migration failed, preserving under recovery key:',
        err,
      );
      await chrome.storage.local.set({
        [`recovery:${Date.now()}`]: rawManifest,
      });
    }
    return bootstrapDefaults();
  }

  // ---------------------------------------------------------------------------
  // Scenario B/D: Attempt v2 validation with valibot.
  // version === 2 → valid v2 (Scenario B) or invalid v2 (Scenario D).
  // version === 99 or other unknown → fails safeParse → Scenario D recovery.
  // ---------------------------------------------------------------------------
  const parseResult = v.safeParse(V2ManifestSchema, rawManifest);
  if (!parseResult.success) {
    // Scenario D: corrupt/invalid data — preserve under recovery key, return defaults
    console.error(
      '[bootstrap] manifest validation failed, preserving under recovery key:',
      parseResult.issues,
    );
    await chrome.storage.local.set({
      [`recovery:${Date.now()}`]: rawManifest,
    });
    return bootstrapDefaults();
  }

  // Scenario B: Valid v2 manifest — load all sessions and run V3→V4 migration
  const manifest = parseResult.output;
  const sessionKeys = manifest.sessions.map((s) => `session:${s.id}`);
  const sessionData = await storageAdapter.read(sessionKeys);

  // V4 migration loop — D-05 (pre-migration snapshot), D-06 (skip-and-continue), D-07 (eager migration)
  const sessions: Record<string, V4Session> = {};
  const failedSessionIds: string[] = [];

  for (const s of manifest.sessions) {
    const key = `session:${s.id}`;
    const rawSession = sessionData[key];

    // Already V4 — pass through without re-migration (Pitfall 3 guard: double-migration prevention)
    const v4Result = v.safeParse(V4SessionSchema, rawSession);
    if (v4Result.success) {
      sessions[s.id] = v4Result.output;
      continue;
    }

    // V3 found — write pre-v4 snapshot (direct set, NOT adapter.snapshot — Pitfall 5 / D-05)
    const v3Result = v.safeParse(V3SessionSchema, rawSession);
    if (v3Result.success) {
      // D-05: write pre-migration snapshot BEFORE migration — direct chrome.storage.local.set
      // (NOT storageAdapter or adapter.snapshot — that calls #trimSnapshots which deletes older entries)
      await chrome.storage.local.set({
        [`snapshot:${s.id}:pre-v4-${Date.now()}`]: rawSession,
      });
      try {
        const v4 = migrateV3ToV4(v3Result.output);
        const validV4 = v.safeParse(V4SessionSchema, v4);
        if (validV4.success) {
          await chrome.storage.local.set({ [key]: v4 });
          sessions[s.id] = validV4.output;
        } else {
          console.error(
            '[bootstrap] V4 validation failed for session:',
            s.id,
            validV4.issues,
          );
          failedSessionIds.push(s.id);
          // D-06: skip-and-continue — failed session excluded from returned sessions map;
          // V3 blob is preserved in storage unchanged (we only wrote the snapshot, not the key)
        }
      } catch (err) {
        console.error('[bootstrap] migrateV3ToV4 threw for session:', s.id, err);
        failedSessionIds.push(s.id);
        // D-06: skip-and-continue — failed session excluded from returned sessions map
      }
      continue;
    }

    // V2 fallback — should not occur post-v1.1 (V2 should have been migrated by v1.0 bootstrap)
    // A V2 session surviving to v1.1 is treated as corrupted; use default V4 session for defense-in-depth
    const v2Result = v.safeParse(V2SessionSchema, rawSession);
    if (v2Result.success) {
      // V2 sessions surviving to v1.1 are corrupted — use default; do NOT push to failedSessionIds
      sessions[s.id] = createDefaultV4Session(s.id);
      continue;
    }

    // Corrupt/unknown — use default V4 session; do NOT push to failedSessionIds (no V3 blob to preserve)
    sessions[s.id] = createDefaultV4Session(s.id);
  }

  return { manifest, sessions, failedSessionIds };
}
