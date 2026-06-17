import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildFilename, exportSession } from './yamlExport.js';

// Minimal V3Session fixture for testing
const minimalSession: V3Session = {
  version: 3,
  id: 'test-session-1',
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
};

describe('exportSession — basic structure', () => {
  it('returns a string starting with "meta:" when called with a minimal session + DEFAULT_SECTIONS', () => {
    const result = exportSession(minimalSession, 'Test Session', DEFAULT_SECTIONS);
    expect(typeof result).toBe('string');
    expect(result.trimStart()).toMatch(/^meta:/);
  });

  it('includes "sections:" key in the output', () => {
    const result = exportSession(minimalSession, 'Test Session', DEFAULT_SECTIONS);
    expect(result).toContain('sections:');
  });
});

describe('exportSession — null and zero scores', () => {
  it('includes `score: null` for unscored questions (js-yaml 4.x serializes null as "null", not "~")', () => {
    const result = exportSession(minimalSession, 'Test Session', DEFAULT_SECTIONS);
    // js-yaml 4.2.0 serializes null as "null" (not "~")
    expect(result).toContain('score: null');
  });

  it('includes `score: 0` for a question scored zero (not null)', () => {
    // twig topic is in frontend section, question index 0 → key "twig-0"
    const sessionWithZero: V3Session = {
      ...minimalSession,
      scores: { 'twig-0': 0 },
    };
    const result = exportSession(sessionWithZero, 'Test Session', DEFAULT_SECTIONS);
    expect(result).toContain('score: 0');
  });
});

describe('exportSession — round-trip score key format', () => {
  it('score stored at key "twig-0" appears at the correct position in output YAML', () => {
    const sessionWithScore: V3Session = {
      ...minimalSession,
      scores: { 'twig-0': 8 },
    };
    const result = exportSession(sessionWithScore, 'Test Session', DEFAULT_SECTIONS);

    // The exported YAML should contain "score: 8" (the value at twig-0)
    expect(result).toContain('score: 8');

    // Verify "index: 0" appears in the output (first question of twig topic)
    expect(result).toContain('index: 0');
  });
});

describe('exportSession — custom questions', () => {
  it('includes customQuestions under their parent topic', () => {
    const sessionWithCustom: V3Session = {
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
    const result = exportSession(sessionWithCustom, 'Test Session', DEFAULT_SECTIONS);
    expect(result).toContain('customQuestions:');
    expect(result).toContain('What is Twig strict mode?');
    expect(result).toContain('score: 9');
  });
});

describe('exportSession — candidate', () => {
  it('includes candidate.name when candidate is set', () => {
    const sessionWithCandidate: V3Session = {
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
    const result = exportSession(sessionWithCandidate, 'Test Session', DEFAULT_SECTIONS);
    expect(result).toContain('Alice Smith');
    expect(result).toContain('candidate:');
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
