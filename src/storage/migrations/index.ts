import type { V1Schema, V2Manifest, V2Session } from '../types.js';
import { migrateV1ToV2 } from './v1-to-v2.js';

/**
 * Migration pipeline entry.
 * Each entry declares the source version it handles and a migration function.
 * New entries are appended here as later phases introduce new schema versions.
 */
const MIGRATIONS: Array<{
  fromVersion: number;
  fn: (r: unknown) => { manifest: V2Manifest; session: V2Session };
}> = [{ fromVersion: 1, fn: (r) => migrateV1ToV2(r as V1Schema) }];

/**
 * Runs the migration pipeline against raw storage data.
 *
 * - Returns null when raw.version === 2 (data is already current; caller handles hydration).
 * - Returns {manifest, session} for any data without version === 2 (legacy v1 or missing version).
 * - For missing/undefined version: treated as v1 (the only legacy format in Phase 3).
 */
export function runMigrations(
  raw: unknown,
): { manifest: V2Manifest; session: V2Session } | null {
  const version =
    raw !== null &&
    typeof raw === 'object' &&
    'version' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).version
      : undefined;

  if (version === 2) {
    return null;
  }

  // Treat any non-v2 version (including undefined/missing) as needing v1 migration.
  const entry = MIGRATIONS.find((m) => m.fromVersion === 1);
  if (entry) {
    return entry.fn(raw);
  }

  // No migration entry found — return null to signal caller should use default state.
  return null;
}
