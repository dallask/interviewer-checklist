import type { V2Session } from '../../types.js';

/**
 * Minimal V2Session fixture — all Record fields empty, candidate filled.
 * Used to verify field rename mapping (questionScore→scores, etc.) with empty records.
 */
export const V2_SESSION_EMPTY: Readonly<V2Session> = Object.freeze({
  version: 2,
  id: 'test-session',
  questionScore: {},
  topicOverride: {},
  questionComment: {},
  cardComment: {},
  customQuestions: {
    'topic-a': [{ id: 1, text: 'Custom Q', level: 'intermediate' }],
  },
  candidate: {
    name: 'Alice',
    email: '',
    role: '',
    date: '',
    interviewer: '',
    details: '',
  },
  customSeq: 1,
});

/**
 * V2Session fixture with non-empty records — verifies all field renames map correctly.
 */
export const V2_SESSION_POPULATED: Readonly<V2Session> = Object.freeze({
  version: 2,
  id: 'populated-session',
  questionScore: { 'topic-b-0': 8, 'topic-b-1': 6 },
  topicOverride: { 'topic-b': 7.5 },
  questionComment: {
    'topic-b-0': 'Good explanation',
    'topic-b-1': 'Needs work',
  },
  cardComment: {
    'topic-b': 'Strong candidate',
    'topic-c': 'Needs improvement',
  },
  customQuestions: {
    'topic-b': [
      { id: 1, text: 'Custom Q 1', level: 'novice' },
      { id: 2, text: 'Custom Q 2', level: 'advanced' },
    ],
    'topic-c': [{ id: 3, text: 'Expert Q', level: 'expert' }],
  },
  candidate: {
    name: 'Bob',
    email: 'bob@example.com',
    role: 'Senior Engineer',
    date: '2026-01-15',
    interviewer: 'Alice',
    details: 'Strong candidate overall',
  },
  customSeq: 3,
});

/**
 * V2Session fixture with empty candidate object — verifies candidate → null mapping.
 */
export const V2_SESSION_EMPTY_CANDIDATE: Readonly<V2Session> = Object.freeze({
  version: 2,
  id: 'empty-candidate-session',
  questionScore: { 'js-0': 5 },
  topicOverride: {},
  questionComment: {},
  cardComment: {},
  customQuestions: {},
  candidate: {},
  customSeq: 0,
});
