import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { materializeSections } from '../storage/migrations/v3-to-v4.js';
import type { V4Session } from '../storage/types.js';
import { exportSession } from './yamlExport.js';
import {
  detectFormat,
  parseLegacy,
  parseStructural,
  parseYaml,
  reKeyImportResultToV4,
} from './yamlImport.js';

const DEFAULT_V4_SECTIONS = materializeSections(DEFAULT_SECTIONS);

// ---------------------------------------------------------------------------
// LEGACY_FIXTURE — spans multiple topics from DEFAULT_SECTIONS
// Per RESEARCH.md: scores at twig-0, twig-4, twig-10 are valid (in DEFAULT_SECTIONS);
// nonexistent-topic-0 is NOT in DEFAULT_SECTIONS → unmatched
// ---------------------------------------------------------------------------
const LEGACY_FIXTURE = {
  // Legacy format: only scores at top level, no 'sections' key
  scores: {
    'twig-0': 8,
    'twig-4': 6,
    'twig-10': 9,
    'nonexistent-topic-0': 5,
  },
  candidate: {
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Senior Developer',
    date: '2026-06-17',
    interviewer: 'Bob Jones',
    details: '',
  },
};

// ---------------------------------------------------------------------------
// parseYaml tests
// ---------------------------------------------------------------------------

describe('parseYaml', () => {
  it('returns { ok: false, error: string } for malformed YAML', () => {
    const result = parseYaml('not: yaml: at: all: [');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe('string');
    }
  });

  it('returns { ok: true, value: ... } for valid YAML', () => {
    const result = parseYaml('key: value');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ key: 'value' });
    }
  });

  it('returns { ok: false } for truly malformed YAML (not a valid parse error)', () => {
    // Additional malformed case: unclosed bracket
    const result = parseYaml('[unclosed');
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectFormat tests
// ---------------------------------------------------------------------------

describe('detectFormat', () => {
  it('returns "structural" when "sections" key is present', () => {
    const result = detectFormat({ sections: [] });
    expect(result).toBe('structural');
  });

  it('returns "legacy" when "sections" key is absent', () => {
    const result = detectFormat({ scores: {} });
    expect(result).toBe('legacy');
  });

  it('returns "unknown" for null input', () => {
    const result = detectFormat(null);
    expect(result).toBe('unknown');
  });

  it('returns "unknown" for non-object input (string)', () => {
    const result = detectFormat('some string');
    expect(result).toBe('unknown');
  });

  it('returns "unknown" for non-object input (number)', () => {
    const result = detectFormat(42);
    expect(result).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// parseLegacy tests
// ---------------------------------------------------------------------------

describe('parseLegacy', () => {
  it('returns modifiedCount=3, unmatchedCount=1 for LEGACY_FIXTURE against DEFAULT_SECTIONS', () => {
    const preview = parseLegacy(LEGACY_FIXTURE, DEFAULT_SECTIONS);
    expect(preview.modifiedCount).toBe(3);
    expect(preview.unmatchedCount).toBe(1);
    expect(preview.addedCount).toBe(0);
  });

  it('result.scores includes twig-0: 8 and excludes nonexistent-topic-0', () => {
    const preview = parseLegacy(LEGACY_FIXTURE, DEFAULT_SECTIONS);
    expect(preview.result.scores['twig-0']).toBe(8);
    expect('nonexistent-topic-0' in preview.result.scores).toBe(false);
  });

  it('preserves candidate from legacy fixture', () => {
    const preview = parseLegacy(LEGACY_FIXTURE, DEFAULT_SECTIONS);
    expect(preview.result.candidate).not.toBeNull();
    expect(preview.result.candidate?.name).toBe('Alice Smith');
  });

  it('addedCount is 0 (legacy format has no custom questions)', () => {
    const preview = parseLegacy(LEGACY_FIXTURE, DEFAULT_SECTIONS);
    expect(preview.addedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseStructural tests
// ---------------------------------------------------------------------------

describe('parseStructural', () => {
  it('round-trip: export a V4Session then parseStructural — scores match', () => {
    const session: V4Session = {
      version: 4,
      id: 'test-session',
      sections: DEFAULT_V4_SECTIONS,
      removedDefaultQuestionIds: [],
      scores: { 'twig-q0': 8, 'twig-q1': 6 },
      overrides: {},
      notes: { 'twig-q0': 'Good answer' },
      topicNotes: {},
      customQuestions: [],
      candidate: null,
    };

    const yamlString = exportSession(session, 'Test Session');
    const parsed = load(yamlString);
    const preview = parseStructural(parsed, DEFAULT_SECTIONS);

    expect(preview.result.scores['twig-0']).toBe(8);
    expect(preview.result.scores['twig-1']).toBe(6);
    expect(preview.result.notes['twig-0']).toBe('Good answer');
  });

  it('parseStructural with duplicate topic IDs uses last-write-wins', () => {
    // Construct a fake structural YAML object with a section having the same topic twice
    const duplicateSections = [
      {
        id: 'frontend',
        label: 'Frontend',
        icon: '🖥️',
        topics: [
          {
            id: 'twig',
            name: 'Twig',
            override: null,
            topicNote: '',
            questions: [{ index: 0, score: 5, note: '' }],
            customQuestions: [],
          },
          {
            // Same topic id again — last-write-wins
            id: 'twig',
            name: 'Twig',
            override: null,
            topicNote: '',
            questions: [{ index: 0, score: 9, note: 'Second entry wins' }],
            customQuestions: [],
          },
        ],
      },
    ];

    const fakeYaml = { sections: duplicateSections, meta: { sessionName: '' } };
    const preview = parseStructural(fakeYaml, DEFAULT_SECTIONS);

    // Last-write-wins: score 9 should win over 5
    expect(preview.result.scores['twig-0']).toBe(9);
    expect(preview.result.notes['twig-0']).toBe('Second entry wins');
  });
});

// ---------------------------------------------------------------------------
// reKeyImportResultToV4 — score key re-keying
// ---------------------------------------------------------------------------

describe('reKeyImportResultToV4 — score key re-keying', () => {
  it('re-keys integer-suffix score keys to q-prefixed format', () => {
    const result = {
      scores: { 'twig-0': 8, 'twig-1': 6 },
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const rekeyed = reKeyImportResultToV4(result);
    expect(rekeyed.scores['twig-q0']).toBe(8);
    expect(rekeyed.scores['twig-q1']).toBe(6);
  });

  it('removes original integer-suffix keys from scores', () => {
    const result = {
      scores: { 'twig-0': 8 },
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const rekeyed = reKeyImportResultToV4(result);
    expect('twig-0' in rekeyed.scores).toBe(false);
  });

  it('passes through custom-* score keys unchanged (no integer suffix at end)', () => {
    const result = {
      scores: { 'custom-twig-1714000000000-0': 7 },
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const rekeyed = reKeyImportResultToV4(result);
    // custom-* keys are excluded from re-keying (starts with 'custom-' guard, CR-03).
    // The key must pass through completely unchanged.
    const allKeys = Object.keys(rekeyed.scores);
    expect(allKeys).toHaveLength(1);
    expect(Object.keys(rekeyed.scores)[0]).toBe('custom-twig-1714000000000-0');
  });
});

// ---------------------------------------------------------------------------
// reKeyImportResultToV4 — notes key re-keying
// ---------------------------------------------------------------------------

describe('reKeyImportResultToV4 — notes key re-keying', () => {
  it('re-keys integer-suffix note keys to q-prefixed format', () => {
    const result = {
      scores: {},
      overrides: {},
      notes: { 'twig-0': 'Good' },
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const rekeyed = reKeyImportResultToV4(result);
    expect(rekeyed.notes['twig-q0']).toBe('Good');
    expect('twig-0' in rekeyed.notes).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reKeyImportResultToV4 — overrides and topicNotes NOT re-keyed
// ---------------------------------------------------------------------------

describe('reKeyImportResultToV4 — overrides and topicNotes NOT re-keyed', () => {
  it('preserves overrides keys unchanged (topicId-keyed, no integer suffix)', () => {
    const result = {
      scores: {},
      overrides: { twig: 7 },
      notes: {},
      topicNotes: { twig: 'Overall solid' },
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const rekeyed = reKeyImportResultToV4(result);
    expect(rekeyed.overrides['twig']).toBe(7);
    expect(rekeyed.topicNotes['twig']).toBe('Overall solid');
  });

  it('does not mutate the input result', () => {
    const result = {
      scores: { 'twig-0': 8 },
      overrides: { twig: 7 },
      notes: { 'twig-0': 'note' },
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      sessionName: '',
    };
    const before = JSON.stringify(result);
    reKeyImportResultToV4(result);
    expect(JSON.stringify(result)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// parseLegacy → reKeyImportResultToV4 integration
// ---------------------------------------------------------------------------

describe('parseLegacy → reKeyImportResultToV4 integration', () => {
  it('parseLegacy produces twig-0 keys; reKeyImportResultToV4 converts them to twig-q0', () => {
    const legacyYaml = {
      scores: { 'twig-0': 8 },
      candidate: null,
    };
    const preview = parseLegacy(legacyYaml, DEFAULT_SECTIONS);
    // parseLegacy output uses V3-format keys
    expect(preview.result.scores['twig-0']).toBe(8);
    // After reKeyImportResultToV4, the key is V4-format
    const rekeyed = reKeyImportResultToV4(preview.result);
    expect(rekeyed.scores['twig-q0']).toBe(8);
    expect('twig-0' in rekeyed.scores).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseStructural — bank delta (YAML-06)
// ---------------------------------------------------------------------------

describe('parseStructural — bank delta (YAML-06)', () => {
  it('v1 YAML (schemaVersion absent): result.sections and removedDefaultQuestionIds are undefined', () => {
    const v1Yaml = {
      meta: { sessionName: 'Session 1' },
      sections: [],
    };
    const preview = parseStructural(v1Yaml, DEFAULT_SECTIONS);
    expect(preview.result.sections).toBeUndefined();
    expect(preview.result.removedDefaultQuestionIds).toBeUndefined();
  });

  it('v2 YAML with no bank block: result.sections and removedDefaultQuestionIds are undefined', () => {
    const v2Yaml = {
      meta: { schemaVersion: 2, sessionName: 'Session 1' },
      sections: [],
    };
    const preview = parseStructural(v2Yaml, DEFAULT_SECTIONS);
    expect(preview.result.sections).toBeUndefined();
    expect(preview.result.removedDefaultQuestionIds).toBeUndefined();
  });

  it('v2 YAML with removedQuestionIds: result.removedDefaultQuestionIds is populated', () => {
    const v2Yaml = {
      meta: { schemaVersion: 2, sessionName: 'Session 1' },
      sections: [],
      bank: {
        removedQuestionIds: ['twig-q0', 'twig-q1'],
      },
    };
    const preview = parseStructural(v2Yaml, DEFAULT_SECTIONS);
    expect(preview.result.removedDefaultQuestionIds).toEqual(['twig-q0', 'twig-q1']);
  });

  it('v2 YAML with addedSections: result.sections includes default + added sections', () => {
    const v2Yaml = {
      meta: { schemaVersion: 2, sessionName: 'Session 1' },
      sections: [],
      bank: {
        addedSections: [
          {
            id: 'custom-section-abc',
            label: 'My Custom Section',
            icon: '🔧',
            isDefault: false,
            topics: [],
          },
        ],
      },
    };
    const preview = parseStructural(v2Yaml, DEFAULT_SECTIONS);
    expect(preview.result.sections).toBeDefined();
    // Should include default sections + the custom one
    const sectionIds = preview.result.sections?.map((s) => s.id) ?? [];
    expect(sectionIds).toContain('custom-section-abc');
    // Default sections are also present
    expect(sectionIds.length).toBeGreaterThan(1);
  });

  it('v2 YAML: addedSection with colliding default ID is skipped (T-14-04)', () => {
    // 'frontend' is a real default section ID — should be skipped
    const v2Yaml = {
      meta: { schemaVersion: 2, sessionName: 'Session 1' },
      sections: [],
      bank: {
        addedSections: [
          {
            id: 'frontend', // collides with default section
            label: 'Attempted Override',
            icon: '⚠',
            isDefault: false,
            topics: [],
          },
          {
            id: 'custom-section-xyz',
            label: 'Legitimate Custom',
            icon: '🔧',
            isDefault: false,
            topics: [],
          },
        ],
      },
    };
    const preview = parseStructural(v2Yaml, DEFAULT_SECTIONS);
    const sectionIds = preview.result.sections?.map((s) => s.id) ?? [];
    // Colliding ID 'frontend' must NOT appear as a user-added section (default already there)
    const frontendSections = sectionIds.filter((id) => id === 'frontend');
    expect(frontendSections).toHaveLength(1); // only the default one, not a duplicate
    expect(sectionIds).toContain('custom-section-xyz');
  });

  it('YAML-05: custom question note is written to result.notes on import', () => {
    const yamlWithCustomNote = {
      meta: { schemaVersion: 2, sessionName: 'Test' },
      sections: [
        {
          id: 'frontend',
          topics: [
            {
              id: 'twig',
              topicNote: '',
              questions: [],
              customQuestions: [
                {
                  id: 'custom-twig-1',
                  text: 'What is Twig strict mode?',
                  level: 'advanced',
                  score: null,
                  note: 'Great answer given about strict mode',
                },
              ],
            },
          ],
        },
      ],
    };
    const preview = parseStructural(yamlWithCustomNote, DEFAULT_SECTIONS);
    // The note should be in result.notes under the newly generated ID
    const noteValues = Object.values(preview.result.notes);
    expect(noteValues).toContain('Great answer given about strict mode');
  });
});
