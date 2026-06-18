import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { materializeSections } from '../storage/migrations/v3-to-v4.js';
import type { V4Session } from '../storage/types.js';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { buildFilename, exportSession } from './yamlExport.js';

// Materialized sections from DEFAULT_SECTIONS — required for V4Session
const DEFAULT_V4_SECTIONS = materializeSections(DEFAULT_SECTIONS);

// Minimal V4Session fixture for testing
const minimalSession: V4Session = {
  version: 4,
  id: 'test-session-1',
  sections: DEFAULT_V4_SECTIONS,
  removedDefaultQuestionIds: [],
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
};

describe('exportSession — basic structure', () => {
  it('returns a string starting with "meta:" when called with a minimal session', () => {
    const result = exportSession(minimalSession, 'Test Session');
    expect(typeof result).toBe('string');
    expect(result.trimStart()).toMatch(/^meta:/);
  });

  it('includes "sections:" key in the output', () => {
    const result = exportSession(minimalSession, 'Test Session');
    expect(result).toContain('sections:');
  });

  it('emits schemaVersion: 2 (YAML-04 / D-05)', () => {
    const result = exportSession(minimalSession, 'Test Session');
    expect(result).toContain('schemaVersion: 2');
  });

  it('includes text and level fields on default questions (YAML-04)', () => {
    const result = exportSession(minimalSession, 'Test Session');
    expect(result).toContain('text:');
    expect(result).toContain('level:');
  });
});

describe('exportSession — null and zero scores', () => {
  it('includes `score: null` for unscored questions (js-yaml 4.x serializes null as "null", not "~")', () => {
    const result = exportSession(minimalSession, 'Test Session');
    // js-yaml 4.2.0 serializes null as "null" (not "~")
    expect(result).toContain('score: null');
  });

  it('includes `score: 0` for a question scored zero (not null)', () => {
    // twig topic is in frontend section, question index 0 → key "twig-q0" (V4 format)
    const sessionWithZero: V4Session = {
      ...minimalSession,
      scores: { 'twig-q0': 0 },
    };
    const result = exportSession(sessionWithZero, 'Test Session');
    expect(result).toContain('score: 0');
  });
});

describe('exportSession — round-trip score key format', () => {
  it('score stored at key "twig-q0" appears at the correct position in output YAML', () => {
    const sessionWithScore: V4Session = {
      ...minimalSession,
      scores: { 'twig-q0': 8 },
    };
    const result = exportSession(sessionWithScore, 'Test Session');

    // The exported YAML should contain "score: 8" (the value at twig-q0)
    expect(result).toContain('score: 8');

    // Verify "index: 0" appears in the output (first question of twig topic)
    expect(result).toContain('index: 0');
  });
});

describe('exportSession — custom questions', () => {
  it('includes customQuestions under their parent topic', () => {
    const sessionWithCustom: V4Session = {
      ...minimalSession,
      customQuestions: [
        {
          id: 'custom-twig-1',
          topicId: 'twig',
          text: 'What is Twig strict mode?',
          level: 'advanced',
        },
      ],
      scores: { 'custom-twig-1': 9 },
    };
    const result = exportSession(sessionWithCustom, 'Test Session');
    expect(result).toContain('customQuestions:');
    expect(result).toContain('What is Twig strict mode?');
    expect(result).toContain('score: 9');
  });
});

describe('exportSession — candidate', () => {
  it('includes candidate.name when candidate is set', () => {
    const sessionWithCandidate: V4Session = {
      ...minimalSession,
      candidate: {
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'Senior Developer',
        date: '2026-06-17',
        interviewer: 'Bob Jones',
        details: '',
      },
    };
    const result = exportSession(sessionWithCandidate, 'Test Session');
    expect(result).toContain('Alice Smith');
    expect(result).toContain('candidate:');
  });
});

describe('exportSession — bank block (YAML-06)', () => {
  it('omits bank block when no removals or additions', () => {
    const result = exportSession(minimalSession, 'Test Session');
    expect(result).not.toContain('bank:');
  });

  it('emits bank block with removedQuestionIds when a default question is removed', () => {
    // Get the first question ID from the first topic
    const firstSection = DEFAULT_V4_SECTIONS[0];
    const firstTopic = firstSection.topics[0];
    const firstQuestionId = firstTopic.questions[0].id;

    const sessionWithRemoval: V4Session = {
      ...minimalSession,
      removedDefaultQuestionIds: [firstQuestionId],
    };
    const result = exportSession(sessionWithRemoval, 'Test Session');
    expect(result).toContain('bank:');
    expect(result).toContain('removedQuestionIds:');
    expect(result).toContain(firstQuestionId);
  });

  it('emits bank block with addedSections when user-added section is present', () => {
    const sessionWithAdded: V4Session = {
      ...minimalSession,
      sections: [
        ...DEFAULT_V4_SECTIONS,
        {
          id: 'custom-section-123',
          label: 'My Section',
          icon: '🔧',
          isDefault: false,
          topics: [],
        },
      ],
    };
    const result = exportSession(sessionWithAdded, 'Test Session');
    expect(result).toContain('bank:');
    expect(result).toContain('addedSections:');
    expect(result).toContain('My Section');
  });

  it('excludes removed default questions from sections output', () => {
    const firstSection = DEFAULT_V4_SECTIONS[0];
    const firstTopic = firstSection.topics[0];
    const firstQuestion = firstTopic.questions[0];

    const sessionWithRemoval: V4Session = {
      ...minimalSession,
      removedDefaultQuestionIds: [firstQuestion.id],
    };

    const result = exportSession(sessionWithRemoval, 'Test Session');
    const parsed = load(result) as Record<string, unknown>;
    const sections = parsed.sections as Array<Record<string, unknown>>;
    const exportedSection = sections.find(
      (s) => s.id === firstSection.id,
    ) as Record<string, unknown>;
    const topics = exportedSection.topics as Array<Record<string, unknown>>;
    const exportedTopic = topics.find(
      (t) => t.id === firstTopic.id,
    ) as Record<string, unknown>;
    const questions = exportedTopic.questions as Array<Record<string, unknown>>;

    // The first question should have been filtered out
    const questionAtIndex0 = questions.find((q) => q.index === 0);
    expect(questionAtIndex0).toBeUndefined();
  });
});

describe('buildFilename', () => {
  it('returns a string matching /^interview-Alice-Smith-\\d{4}-\\d{2}-\\d{2}\\.yaml$/ for "Alice Smith"', () => {
    const filename = buildFilename('Alice Smith');
    expect(filename).toMatch(/^interview-Alice-Smith-\d{4}-\d{2}-\d{2}\.yaml$/);
  });

  it('strips special characters from session name', () => {
    const filename = buildFilename('Alice <Test>!');
    // Special chars stripped, spaces replaced with dashes
    expect(filename).toMatch(/^interview-Alice-Test-\d{4}-\d{2}-\d{2}\.yaml$/);
  });
});
