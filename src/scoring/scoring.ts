import type { Topic } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';

/** Named tier for a computed or overridden mark. */
export type MarkBand = 'none' | 'low' | 'mid' | 'good' | 'high';

/** Map from question key (`${topicId}-${questionIndex}`) to score (0–10). null/absent = unscored. */
export type ScoreMap = Record<string, number | null>;

/** Result of scoring a single topic. */
export interface TopicResult {
  mark: number | null;
  band: MarkBand;
  /** Number of questions that contributed a score. */
  scoredCount: number;
  /** Total questions in the topic (built-in only). */
  totalCount: number;
}

/** Result of scoring a section (group of topics). */
export interface SectionResult {
  mark: number | null;
  band: MarkBand;
  scoredTopics: number;
  totalTopics: number;
}

/** Result of scoring all topics across all sections. */
export interface OverallResult {
  mark: number | null;
  band: MarkBand;
  scoredTopics: number;
  totalTopics: number;
}

/**
 * Difficulty-weighted average of scored questions within a topic.
 *
 * Question key scheme (locked): `${topic.id}-${questionIndex}`
 * Override replaces the computed mark entirely if provided (valid range 0–10, including 0).
 */
export function computeTopicMark(
  topic: Topic,
  scores: ScoreMap,
  override?: number | null,
): TopicResult {
  let weightedSum = 0;
  let coeffSum = 0;
  let scoredCount = 0;

  topic.questions.forEach((q, i) => {
    const key = `${topic.id}-${i}`;
    const score = scores[key];
    // Use typeof + isFinite guard — admits score=0 as valid, skips null/undefined/missing/NaN/Infinity
    if (typeof score !== 'number' || !Number.isFinite(score)) return;
    const coef = DIFFICULTY_COEFFICIENTS[q.level];
    weightedSum += coef * score;
    coeffSum += coef;
    scoredCount++;
  });

  // Override validation: typeof check correctly admits override=0 as valid.
  // scoredCount reflects actual scored questions even when override is active,
  // so consumers can display "X of N scored (mark overridden)".
  if (typeof override === 'number' && override >= 0 && override <= 10) {
    return {
      mark: override,
      band: getMarkBand(override),
      scoredCount,
      totalCount: topic.questions.length,
    };
  }

  const mark = coeffSum > 0 ? weightedSum / coeffSum : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredCount,
    totalCount: topic.questions.length,
  };
}

/**
 * Plain arithmetic mean of non-null topic marks within a section.
 * Callers pass in pre-computed TopicResult[] for the section's topics.
 */
export function computeSectionMark(topicResults: TopicResult[]): SectionResult {
  const marks = topicResults
    .map((r) => r.mark)
    .filter((m): m is number => m !== null);
  const mark =
    marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredTopics: marks.length,
    totalTopics: topicResults.length,
  };
}

/**
 * Plain arithmetic mean across ALL topic final marks, flattened across all sections.
 *
 * This is mean-of-topics (not mean-of-groups) — matching prototype behavior.
 * Groups with more topics (e.g. backend: 22) have proportionally more influence
 * than groups with fewer topics (e.g. design: 5).
 *
 * Signature accepts TopicResult[] (not SectionResult[]) — see RESEARCH.md Pitfall 2.
 */
export function computeOverallMark(
  allTopicResults: TopicResult[],
): OverallResult {
  const marks = allTopicResults
    .map((r) => r.mark)
    .filter((m): m is number => m !== null);
  const mark =
    marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredTopics: marks.length,
    totalTopics: allTopicResults.length,
  };
}

/**
 * Classify a numeric mark into a named band per CONTEXT.md thresholds.
 * Thresholds deliberately differ from the prototype — CONTEXT.md is authoritative.
 *
 * null → 'none'
 * [0, 5)    → 'low'
 * [5, 6.5)  → 'mid'
 * [6.5, 8)  → 'good'
 * [8, 10]   → 'high'
 */
export function getMarkBand(mark: number | null): MarkBand {
  if (mark === null || !Number.isFinite(mark)) return 'none';
  if (mark < 5) return 'low';
  if (mark < 6.5) return 'mid';
  if (mark < 8) return 'good';
  return 'high';
}
