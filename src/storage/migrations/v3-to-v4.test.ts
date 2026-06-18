import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../../data/bank/index.js';
import { V4SessionSchema } from '../types.js';
import {
  V3_SESSION_EMPTY,
  V3_SESSION_NULL_CANDIDATE,
  V3_SESSION_POPULATED,
} from './fixtures/v3-session-fixture.js';
import { migrateV3ToV4 } from './v3-to-v4.js';

describe('migrateV3ToV4 — score key re-keying', () => {
  it('re-keys twig-0 → twig-q0 in scores', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.scores['twig-q0']).toBe(8);
  });

  it('re-keys twig-1 → twig-q1 in scores', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.scores['twig-q1']).toBe(6);
  });

  it('removes the old twig-0 key from scores', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect('twig-0' in result.scores).toBe(false);
  });

  it('removes the old twig-1 key from scores', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect('twig-1' in result.scores).toBe(false);
  });

  it('produces empty scores record from empty session', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.scores).toEqual({});
  });

  it('re-keys js-0 → js-q0 in scores (null-candidate fixture)', () => {
    const result = migrateV3ToV4(V3_SESSION_NULL_CANDIDATE);
    expect(result.scores['js-q0']).toBe(5);
    expect('js-0' in result.scores).toBe(false);
  });
});

describe('migrateV3ToV4 — notes key re-keying', () => {
  it('re-keys twig-0 → twig-q0 in notes', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.notes['twig-q0']).toBe('Good answer');
  });

  it('re-keys twig-1 → twig-q1 in notes', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.notes['twig-q1']).toBe('');
  });

  it('removes the old twig-0 key from notes', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect('twig-0' in result.notes).toBe(false);
  });

  it('produces empty notes record from empty session', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.notes).toEqual({});
  });
});

describe('migrateV3ToV4 — overrides and topicNotes NOT re-keyed', () => {
  it('preserves overrides key twig unchanged', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.overrides['twig']).toBe(7);
  });

  it('does not add twig-qN key to overrides', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect('twig-q0' in result.overrides).toBe(false);
  });

  it('preserves topicNotes key twig unchanged', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.topicNotes['twig']).toBe('Overall solid');
  });

  it('does not add twig-qN key to topicNotes', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect('twig-q0' in result.topicNotes).toBe(false);
  });
});

describe('migrateV3ToV4 — sections materialization', () => {
  it('sections is a non-empty array', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it('sections length equals DEFAULT_SECTIONS length', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections.length).toBe(DEFAULT_SECTIONS.length);
  });

  it('first section has isDefault: true', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections[0].isDefault).toBe(true);
  });

  it('first topic in first section has isDefault: true', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections[0].topics[0].isDefault).toBe(true);
  });

  it('first question in first topic has isDefault: true', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections[0].topics[0].questions[0].isDefault).toBe(true);
  });

  it('question IDs follow stable pattern ${topicId}-q${idx}', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    const firstTopic = result.sections[0].topics[0];
    expect(firstTopic.questions[0].id).toBe(`${firstTopic.id}-q0`);
    if (firstTopic.questions.length > 1) {
      expect(firstTopic.questions[1].id).toBe(`${firstTopic.id}-q1`);
    }
  });

  it('all question IDs match pattern /^.+-q\\d+$/', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    for (const section of result.sections) {
      for (const topic of section.topics) {
        for (const question of topic.questions) {
          expect(question.id).toMatch(/^.+-q\d+$/);
        }
      }
    }
  });

  it('twig topic questions have IDs starting with twig-q', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    const twigTopic = result.sections
      .flatMap((s) => s.topics)
      .find((t) => t.id === 'twig');
    expect(twigTopic).toBeDefined();
    expect(twigTopic?.questions[0].id).toBe('twig-q0');
  });

  it('sections array is a deep copy — not the same object reference as DEFAULT_SECTIONS', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.sections[0]).not.toBe(DEFAULT_SECTIONS[0]);
  });
});

describe('migrateV3ToV4 — customQuestions pass-through', () => {
  it('passes customQuestions array through unchanged', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.customQuestions).toHaveLength(1);
  });

  it('preserves custom question id', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.customQuestions[0].id).toBe('custom-twig-1714000000000-0');
  });

  it('preserves custom question topicId', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.customQuestions[0].topicId).toBe('twig');
  });

  it('preserves custom question text and level', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.customQuestions[0].text).toBe('Custom Q');
    expect(result.customQuestions[0].level).toBe('novice');
  });

  it('produces empty customQuestions from empty session', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.customQuestions).toEqual([]);
  });
});

describe('migrateV3ToV4 — version and id', () => {
  it('sets version: 4', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.version).toBe(4);
  });

  it('preserves id from source session', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.id).toBe('test-v3-session');
  });

  it('preserves populated session id', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.id).toBe('populated-v3-session');
  });
});

describe('migrateV3ToV4 — candidate handling', () => {
  it('preserves null candidate', () => {
    const result = migrateV3ToV4(V3_SESSION_NULL_CANDIDATE);
    expect(result.candidate).toBeNull();
  });

  it('preserves all 6 CandidateDetails fields when candidate is populated', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    expect(result.candidate).toEqual({
      name: 'Test Candidate',
      email: 'test@example.com',
      role: 'Engineer',
      date: '2026-06-18',
      interviewer: 'Interviewer',
      details: '',
    });
  });

  it('preserves candidate from empty session (null case)', () => {
    const result = migrateV3ToV4(V3_SESSION_EMPTY);
    expect(result.candidate).toBeNull();
  });
});

describe('migrateV3ToV4 — immutability', () => {
  it('does not mutate the frozen input', () => {
    const before = JSON.stringify(V3_SESSION_POPULATED);
    migrateV3ToV4(V3_SESSION_POPULATED);
    expect(JSON.stringify(V3_SESSION_POPULATED)).toBe(before);
  });
});

describe('V4SessionSchema — valibot validation', () => {
  it('validates a correct V4 object — parse succeeds', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    const parsed = v.safeParse(V4SessionSchema, result);
    expect(parsed.success).toBe(true);
  });

  it('rejects a version: 3 object — safeParse returns success: false', () => {
    const parsed = v.safeParse(V4SessionSchema, V3_SESSION_EMPTY);
    expect(parsed.success).toBe(false);
  });

  it('validates migrated V4 from all fixtures', () => {
    for (const fixture of [
      V3_SESSION_EMPTY,
      V3_SESSION_POPULATED,
      V3_SESSION_NULL_CANDIDATE,
    ]) {
      const result = migrateV3ToV4(fixture);
      const parsed = v.safeParse(V4SessionSchema, result);
      expect(parsed.success).toBe(true);
    }
  });
});
