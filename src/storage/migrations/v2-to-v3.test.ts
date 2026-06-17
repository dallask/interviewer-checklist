import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { V3SessionSchema } from '../types.js';
import {
  V2_SESSION_EMPTY,
  V2_SESSION_EMPTY_CANDIDATE,
  V2_SESSION_POPULATED,
} from './fixtures/v2-session-fixture.js';
import { migrateV2ToV3 } from './v2-to-v3.js';

describe('migrateV2ToV3 — field renames', () => {
  it('maps questionScore → scores (empty records)', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.scores).toEqual({});
  });

  it('maps topicOverride → overrides (empty records)', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.overrides).toEqual({});
  });

  it('maps questionComment → notes (empty records)', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.notes).toEqual({});
  });

  it('maps cardComment → topicNotes (empty records)', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.topicNotes).toEqual({});
  });

  it('maps questionScore → scores with values from populated fixture', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.scores).toEqual({ 'topic-b-0': 8, 'topic-b-1': 6 });
  });

  it('maps topicOverride → overrides with values from populated fixture', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.overrides).toEqual({ 'topic-b': 7.5 });
  });

  it('maps questionComment → notes with values from populated fixture', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.notes).toEqual({
      'topic-b-0': 'Good explanation',
      'topic-b-1': 'Needs work',
    });
  });

  it('maps cardComment → topicNotes with values from populated fixture', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.topicNotes).toEqual({
      'topic-b': 'Strong candidate',
      'topic-c': 'Needs improvement',
    });
  });
});

describe('migrateV2ToV3 — customQuestions flattening', () => {
  it('flattens customQuestions Record to CustomQuestion[] using custom-${topicId}-${q.id} ids', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.customQuestions).toHaveLength(1);
    expect(result.customQuestions[0]).toEqual({
      id: 'custom-topic-a-1',
      topicId: 'topic-a',
      text: 'Custom Q',
      level: 'intermediate',
    });
  });

  it('flattens multiple topics and questions correctly', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.customQuestions).toHaveLength(3);
    const ids = result.customQuestions.map((q) => q.id);
    expect(ids).toContain('custom-topic-b-1');
    expect(ids).toContain('custom-topic-b-2');
    expect(ids).toContain('custom-topic-c-3');
  });

  it('preserves topicId on each CustomQuestion', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    const topicBQs = result.customQuestions.filter((q) => q.topicId === 'topic-b');
    expect(topicBQs).toHaveLength(2);
  });

  it('produces empty customQuestions array when source record is empty', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY_CANDIDATE);
    expect(result.customQuestions).toEqual([]);
  });
});

describe('migrateV2ToV3 — version and id', () => {
  it('sets version: 3', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.version).toBe(3);
  });

  it('preserves id from source session', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect(result.id).toBe('test-session');
  });

  it('does NOT include customSeq in output', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    expect('customSeq' in result).toBe(false);
  });
});

describe('migrateV2ToV3 — candidate handling', () => {
  it('preserves all 6 CandidateDetails fields when candidate is populated', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    expect(result.candidate).toEqual({
      name: 'Bob',
      email: 'bob@example.com',
      role: 'Senior Engineer',
      date: '2026-01-15',
      interviewer: 'Alice',
      details: 'Strong candidate overall',
    });
  });

  it('produces candidate: null when candidate is empty object {}', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY_CANDIDATE);
    expect(result.candidate).toBeNull();
  });

  it('preserves candidate when only name is provided (partial candidate)', () => {
    const result = migrateV2ToV3(V2_SESSION_EMPTY);
    // V2_SESSION_EMPTY has name:'Alice' and empty strings for others
    expect(result.candidate).not.toBeNull();
    expect(result.candidate?.name).toBe('Alice');
  });
});

describe('migrateV2ToV3 — immutability', () => {
  it('does not mutate the frozen input', () => {
    const before = JSON.stringify(V2_SESSION_POPULATED);
    migrateV2ToV3(V2_SESSION_POPULATED);
    expect(JSON.stringify(V2_SESSION_POPULATED)).toBe(before);
  });
});

describe('V3SessionSchema — valibot validation', () => {
  it('validates a correct V3 object — parse succeeds', () => {
    const result = migrateV2ToV3(V2_SESSION_POPULATED);
    const parsed = v.safeParse(V3SessionSchema, result);
    expect(parsed.success).toBe(true);
  });

  it('rejects a version: 2 object — safeParse returns success: false', () => {
    const parsed = v.safeParse(V3SessionSchema, V2_SESSION_EMPTY);
    expect(parsed.success).toBe(false);
  });

  it('validates migrated V3 from all fixtures', () => {
    for (const fixture of [V2_SESSION_EMPTY, V2_SESSION_POPULATED, V2_SESSION_EMPTY_CANDIDATE]) {
      const result = migrateV2ToV3(fixture);
      const parsed = v.safeParse(V3SessionSchema, result);
      expect(parsed.success).toBe(true);
    }
  });
});
