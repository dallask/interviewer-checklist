import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { exportSession } from './yamlExport.js';
import {
  detectFormat,
  parseLegacy,
  parseStructural,
  parseYaml,
} from './yamlImport.js';

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
  it('round-trip: export a session then parseStructural — scores match', () => {
    const session: V3Session = {
      version: 3,
      id: 'test-session',
      scores: { 'twig-0': 8, 'twig-1': 6 },
      overrides: {},
      notes: { 'twig-0': 'Good answer' },
      topicNotes: {},
      customQuestions: [],
      candidate: null,
    };

    const yamlString = exportSession(session, 'Test Session', DEFAULT_SECTIONS);
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
