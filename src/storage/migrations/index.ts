import type { V1Schema, V2Manifest, V2Session, V3Session } from '../types.js';
import { migrateV1ToV2 } from './v1-to-v2.js';
import { migrateV2ToV3 } from './v2-to-v3.js';

/**
 * Migration pipeline entry.
 * Each entry declares the source version it handles and a migration function.
 * New entries are appended here as later phases introduce new schema versions.
 */
const MIGRATIONS: Array<{
  fromVersion: number;
  fn: (r: unknown) => { manifest: V2Manifest; session: V2Session } | V3Session;
}> = [
  { fromVersion: 1, fn: (r) => migrateV1ToV2(r as V1Schema) },
  { fromVersion: 2, fn: (r) => migrateV2ToV3(r as V2Session) },
];

/**
 * Runs the migration pipeline against raw storage data.
 *
 * - Returns null when raw.version === 2 (data is already current; caller handles hydration).
 * - Returns {manifest, session} for v1 data (migrateV1ToV2 output).
 * - Returns V3Session for v2 data (migrateV2ToV3 output).
 * - For missing/undefined version: treated as v1 (the only legacy format in Phase 3).
 */
export function runMigrations(
  raw: unknown,
): { manifest: V2Manifest; session: V2Session } | V3Session | null {
  const version =
    raw !== null &&
    typeof raw === 'object' &&
    'version' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).version
      : undefined;

  if (version === 2) {
    const entry = MIGRATIONS.find((m) => m.fromVersion === 2);
    if (entry) {
      return entry.fn(raw) as V3Session;
    }
    return null;
  }

  if (version === 3) {
    // Already at latest version — caller handles hydration.
    return null;
  }

  // Treat any non-v2/v3 version (including undefined/missing) as needing v1 migration.
  const entry = MIGRATIONS.find((m) => m.fromVersion === 1);
  if (entry) {
    return entry.fn(raw) as { manifest: V2Manifest; session: V2Session };
  }

  // No migration entry found — return null to signal caller should use default state.
  return null;
}
