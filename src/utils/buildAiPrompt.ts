import type { Section } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
import { computeTopicMark } from '../scoring/scoring.js';

// Suppress unused-import warning for GREEN phase — these are used in the full implementation
void DIFFICULTY_COEFFICIENTS;
void computeTopicMark;

/**
 * Build an AI feedback prompt string from a V3Session and section data.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-${questionIndex}` (matches src/store/app.ts line 70).
 * Custom question score key: cq.id (e.g. 'custom-twig-1') — same as store.
 */
export function buildAiPrompt(
  _session: V3Session,
  _sections: readonly Section[],
): string {
  return '';
}
