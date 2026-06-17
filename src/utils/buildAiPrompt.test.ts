import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildAiPrompt } from './buildAiPrompt.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

const sessionWithScore: V3Session = {
  ...minimalSession,
  scores: { 'twig-0': 8 },
  notes: { 'twig-0': 'Knows Twig basics well.' },
};

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

const sessionWithCandidateDetails: V3Session = {
  ...minimalSession,
  candidate: {
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Senior Developer',
    date: '2026-06-17',
    interviewer: 'Bob Jones',
    details: 'Very enthusiastic candidate.',
  },
};

const sessionWithCustomQuestion: V3Session = {
  ...minimalSession,
  customQuestions: [
    {
      id: 'custom-twig-1',
      topicId: 'twig',
      text: 'What is Twig strict mode?',
      level: 'advanced',
    },
  ],
  scores: { 'custom-twig-1': 7 },
};

const sessionWithTopicNote: V3Session = {
  ...minimalSession,
  topicNotes: { twig: 'Candidate excels at templating.' },
};

const sessionWithQuestionNote: V3Session = {
  ...minimalSession,
  scores: { 'twig-0': 5 },
  notes: { 'twig-0': 'Needs improvement on variable scope.' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildAiPrompt — basic structure', () => {
  it('returns a non-empty string for a minimal empty session', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains "## Task" block at the end of every generated prompt', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('## Task');
  });

  it('contains section headings formatted as "## {label}"', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    // DEFAULT_SECTIONS has a "Frontend" section
    expect(result).toContain('## Frontend');
  });
});

describe('buildAiPrompt — candidate handling', () => {
  it('contains "(not set)" for null candidate', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('(not set)');
  });

  it('contains the candidate name when candidate is set', () => {
    const result = buildAiPrompt(sessionWithCandidate, DEFAULT_SECTIONS);
    expect(result).toContain('Alice Smith');
  });

  it('appends "Notes:" line when candidate.details is non-empty', () => {
    const result = buildAiPrompt(sessionWithCandidateDetails, DEFAULT_SECTIONS);
    expect(result).toContain('Notes: Very enthusiastic candidate.');
  });
});

describe('buildAiPrompt — empty session / no scores', () => {
  it('contains "No scores yet" placeholder when no questions are scored in a topic', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('No scores yet');
  });
});

describe('buildAiPrompt — scored session', () => {
  it('contains "[8]" for a question scored 8 (key twig-0)', () => {
    const result = buildAiPrompt(sessionWithScore, DEFAULT_SECTIONS);
    expect(result).toContain('[8]');
  });

  it('contains "[skipped]" for an unscored question', () => {
    // minimalSession has no scores — all questions are skipped
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('[skipped]');
  });
});

describe('buildAiPrompt — per-question notes', () => {
  it('appends "Note:" beneath the question line when a note is present', () => {
    const result = buildAiPrompt(sessionWithQuestionNote, DEFAULT_SECTIONS);
    expect(result).toContain('Note: Needs improvement on variable scope.');
  });
});

describe('buildAiPrompt — custom questions', () => {
  it('renders "(custom)" label for custom questions', () => {
    const result = buildAiPrompt(sessionWithCustomQuestion, DEFAULT_SECTIONS);
    expect(result).toContain('(custom)');
  });

  it('uses cq.id as the score key for custom questions (not positional index)', () => {
    // Score stored at 'custom-twig-1' — if wrong key used, score would show as [skipped]
    const result = buildAiPrompt(sessionWithCustomQuestion, DEFAULT_SECTIONS);
    expect(result).toContain('[7]');
  });

  it('contains the custom question text', () => {
    const result = buildAiPrompt(sessionWithCustomQuestion, DEFAULT_SECTIONS);
    expect(result).toContain('What is Twig strict mode?');
  });
});

describe('buildAiPrompt — topic notes', () => {
  it('includes the topic note when topicNotes has an entry for that topic', () => {
    const result = buildAiPrompt(sessionWithTopicNote, DEFAULT_SECTIONS);
    expect(result).toContain('Candidate excels at templating.');
  });

  it('includes "Topic notes:" label when topic note is present', () => {
    const result = buildAiPrompt(sessionWithTopicNote, DEFAULT_SECTIONS);
    expect(result).toContain('Topic notes:');
  });
});

describe('buildAiPrompt — difficulty weighting note', () => {
  it('contains "weighted" keyword in the difficulty note per topic', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('weighted');
  });

  it('contains "Difficulty:" label per topic', () => {
    const result = buildAiPrompt(minimalSession, DEFAULT_SECTIONS);
    expect(result).toContain('Difficulty:');
  });
});
