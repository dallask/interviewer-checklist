// src/storage/bootstrap.ts
// Async migration orchestrator — runs the full migration pipeline, validates
// with valibot, and returns hydrated V2 state before createRoot is called.
// Implements STORE-03. Never throws — all error paths return valid {manifest, sessions}.

import * as v from 'valibot';
import { storageAdapter } from './adapter.js';
import { runMigrations } from './migrations/index.js';
import type { V2Manifest, V2Session } from './types.js';
import {
  createDefaultManifest,
  createDefaultSession,
  V2ManifestSchema,
  V2SessionSchema,
} from './types.js';

/** Returns a fresh default state and writes it to storage. */
async function bootstrapDefaults(): Promise<{
  manifest: V2Manifest;
  sessions: Record<string, V2Session>;
}> {
  const manifest = createDefaultManifest();
  const defaultSession = createDefaultSession(manifest.sessions[0].id);
  await chrome.storage.local.set({
    manifest,
    [`session:${manifest.sessions[0].id}`]: defaultSession,
  });
  return { manifest, sessions: { [manifest.sessions[0].id]: defaultSession } };
}

/**
 * Bootstraps the storage layer before the app mounts.
 *
 * Four scenarios handled:
 *   A) Empty storage (first run) — creates default V2Manifest + V2Session, writes both.
 *   B) Valid v2 manifest — validates with valibot, loads all sessions, returns hydrated state.
 *   C) Legacy v1 data (version < 2 or non-numeric version) — runs runMigrations, writes
 *      migrated manifest+session.
 *   D) Corrupt/invalid data (fails V2ManifestSchema and is not v1) — writes
 *      recovery:timestamp key, bootstraps with default state.
 *
 * Contract: always returns a valid {manifest, sessions} object; never throws.
 */
export async function bootstrap(): Promise<{
  manifest: V2Manifest;
  sessions: Record<string, V2Session>;
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
      if (migrated !== null) {
        await chrome.storage.local.set({
          manifest: migrated.manifest,
          [`session:${migrated.session.id}`]: migrated.session,
        });
        return {
          manifest: migrated.manifest,
          sessions: { [migrated.session.id]: migrated.session },
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
    // Migration returned null or threw — use default state
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

  // Scenario B: Valid v2 manifest — load all sessions
  const manifest = parseResult.output;
  const sessionKeys = manifest.sessions.map((s) => `session:${s.id}`);
  const sessionData = await storageAdapter.read(sessionKeys);

  const sessions: Record<string, V2Session> = {};
  for (const s of manifest.sessions) {
    const key = `session:${s.id}`;
    const sessionParseResult = v.safeParse(V2SessionSchema, sessionData[key]);
    sessions[s.id] = sessionParseResult.success
      ? sessionParseResult.output
      : createDefaultSession(s.id);
  }

  return { manifest, sessions };
}
