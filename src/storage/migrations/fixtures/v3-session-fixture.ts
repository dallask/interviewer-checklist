import type { V3Session } from '../../types.js';

/**
 * Minimal V3Session — all Record fields empty; candidate null.
 * Verifies sections array is produced even with no scores.
 */
export const V3_SESSION_EMPTY: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'test-v3-session',
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
});

/**
 * V3Session with real topic IDs so remapScoreKeys assertions use real key patterns.
 * 'twig-0' → 'twig-q0'; 'custom-twig-...' passes through the customQuestions array unchanged.
 */
export const V3_SESSION_POPULATED: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'populated-v3-session',
  scores: { 'twig-0': 8, 'twig-1': 6 },
  overrides: { twig: 7 },
  notes: { 'twig-0': 'Good answer', 'twig-1': '' },
  topicNotes: { twig: 'Overall solid' },
  customQuestions: [
    {
      id: 'custom-twig-1714000000000-0',
      topicId: 'twig',
      text: 'Custom Q',
      level: 'novice',
    },
  ],
  candidate: {
    name: 'Test Candidate',
    email: 'test@example.com',
    role: 'Engineer',
    date: '2026-06-18',
    interviewer: 'Interviewer',
    details: '',
  },
});

/**
 * V3Session with empty candidate — verifies candidate: null preserved through migration.
 */
export const V3_SESSION_NULL_CANDIDATE: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'null-candidate-session',
  scores: { 'js-0': 5 },
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
});
