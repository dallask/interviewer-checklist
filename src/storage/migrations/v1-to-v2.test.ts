import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { V2ManifestSchema, V2SessionSchema } from '../types.js';
import { migrateV1ToV2 } from './v1-to-v2.js';
import { runMigrations } from './index.js';
import v1FixtureRaw from './fixtures/v1-snapshot.json' with { type: 'json' };

type V1Schema = import('../types.js').V1Schema;

const FROZEN_V1 = Object.freeze(v1FixtureRaw) as V1Schema;

describe('migrateV1ToV2', () => {
  it('returns manifest with version === 2', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.manifest.version).toBe(2);
  });

  it('returns session with version === 2', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.session.version).toBe(2);
  });

  it('maps questionScore from fixture', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.session.questionScore).toEqual(FROZEN_V1.questionScore ?? {});
  });

  it('maps topicOverride from fixture', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.session.topicOverride).toEqual(FROZEN_V1.topicOverride ?? {});
  });

  it('maps candidate from fixture', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.session.candidate).toEqual(FROZEN_V1.candidate ?? {});
  });

  it('maps customQuestions from fixture', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    expect(result.session.customQuestions).toEqual(FROZEN_V1.customQuestions ?? {});
  });

  it('does NOT mutate the frozen input', () => {
    const before = JSON.stringify(FROZEN_V1);
    migrateV1ToV2(FROZEN_V1);
    expect(JSON.stringify(FROZEN_V1)).toBe(before);
  });

  it('produces output that passes V2SessionSchema valibot validation', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    const r = v.safeParse(V2SessionSchema, result.session);
    expect(r.success).toBe(true);
  });

  it('produces output that passes V2ManifestSchema valibot validation', () => {
    const result = migrateV1ToV2(FROZEN_V1);
    const r = v.safeParse(V2ManifestSchema, result.manifest);
    expect(r.success).toBe(true);
  });

  it('returns empty {} for session.questionScore when V1 has missing field', () => {
    const partial = Object.freeze({
      ...FROZEN_V1,
      questionScore: undefined as unknown as Record<string, number>,
    }) as V1Schema;
    const result = migrateV1ToV2(partial);
    expect(result.session.questionScore).toEqual({});
  });
});

describe('runMigrations', () => {
  it('returns {manifest, session} via migrateV1ToV2 when raw has no version field', () => {
    const raw: Record<string, unknown> = { ...FROZEN_V1 };
    delete raw['version'];
    const result = runMigrations(raw);
    expect(result).not.toBeNull();
    expect(result?.manifest.version).toBe(2);
    expect(result?.session.version).toBe(2);
  });

  it('returns null when raw.version === 2 (already migrated)', () => {
    const raw = { version: 2 };
    const result = runMigrations(raw);
    expect(result).toBeNull();
  });
});
