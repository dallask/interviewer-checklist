import { describe, it, expect } from 'vitest';
import {
  computeTopicMark,
  computeSectionMark,
  computeOverallMark,
  getMarkBand,
} from './index.js';
import type { TopicResult } from './index.js';

// Prototype-derived fixture: Twig topic (12 questions)
// topic.id = 'twig', questions indexed 0..11
// levels from prototype: [novice, intermediate, intermediate, intermediate, advanced, advanced, expert, novice, novice, advanced, expert, expert]
// coefficients: novice=1.0, intermediate=1.25, advanced=1.5, expert=1.75
const TWIG_TOPIC = {
  id: 'twig',
  name: 'Twig',
  desc: '',
  tag: '',
  questions: [
    { q: 'q0', level: 'novice' as const },
    { q: 'q1', level: 'intermediate' as const },
    { q: 'q2', level: 'intermediate' as const },
    { q: 'q3', level: 'intermediate' as const },
    { q: 'q4', level: 'advanced' as const },
    { q: 'q5', level: 'advanced' as const },
    { q: 'q6', level: 'expert' as const },
    { q: 'q7', level: 'novice' as const },
    { q: 'q8', level: 'novice' as const },
    { q: 'q9', level: 'advanced' as const },
    { q: 'q10', level: 'expert' as const },
    { q: 'q11', level: 'expert' as const },
  ],
};

// Empty topic fixture for edge-case coverage
const EMPTY_TOPIC = {
  id: 'empty',
  name: 'Empty',
  desc: '',
  tag: '',
  questions: [] as { q: string; level: 'novice' | 'intermediate' | 'advanced' | 'expert' }[],
};

describe('computeTopicMark', () => {
  it('returns null mark when no scores provided', () => {
    const result = computeTopicMark(TWIG_TOPIC, {});
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredCount).toBe(0);
    expect(result.totalCount).toBe(12);
  });

  it('score of 0 is valid and scores the question (not skipped)', () => {
    const scores = { 'twig-0': 0 }; // novice q0 = 0
    const result = computeTopicMark(TWIG_TOPIC, scores);
    expect(result.mark).toBe(0); // 1.0*0 / 1.0 = 0
    expect(result.band).toBe('low');
    expect(result.scoredCount).toBe(1);
  });

  it('computes weighted average correctly with multiple scores', () => {
    // Score q0 (novice, coef=1.0) = 8, q4 (advanced, coef=1.5) = 6
    // weightedSum = 1.0*8 + 1.5*6 = 8 + 9 = 17
    // coeffSum = 1.0 + 1.5 = 2.5
    // mark = 17/2.5 = 6.8
    const scores = { 'twig-0': 8, 'twig-4': 6 };
    const result = computeTopicMark(TWIG_TOPIC, scores);
    expect(result.mark).toBeCloseTo(6.8, 5);
    expect(result.band).toBe('good');
    expect(result.scoredCount).toBe(2);
  });

  it('override replaces computed mark', () => {
    const scores = { 'twig-0': 3 };
    const result = computeTopicMark(TWIG_TOPIC, scores, 9);
    expect(result.mark).toBe(9);
    expect(result.band).toBe('high');
  });

  it('override of 0 is valid (not treated as null)', () => {
    const scores = { 'twig-0': 10 };
    const result = computeTopicMark(TWIG_TOPIC, scores, 0);
    expect(result.mark).toBe(0);
    expect(result.band).toBe('low');
  });

  it('null override falls through to weighted average', () => {
    const scores = { 'twig-0': 8, 'twig-4': 6 };
    const result = computeTopicMark(TWIG_TOPIC, scores, null);
    expect(result.mark).toBeCloseTo(6.8, 5);
  });

  it('undefined override falls through to weighted average', () => {
    const scores = { 'twig-0': 8, 'twig-4': 6 };
    const result = computeTopicMark(TWIG_TOPIC, scores, undefined);
    expect(result.mark).toBeCloseTo(6.8, 5);
  });

  it('topic with zero questions returns null mark', () => {
    const result = computeTopicMark(EMPTY_TOPIC, {});
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('null value in scores map is treated as unscored', () => {
    const scores = { 'twig-0': null };
    const result = computeTopicMark(TWIG_TOPIC, scores);
    expect(result.mark).toBeNull();
    expect(result.scoredCount).toBe(0);
  });
});

describe('computeSectionMark', () => {
  it('returns null mark when given empty topic results', () => {
    const result = computeSectionMark([]);
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredTopics).toBe(0);
    expect(result.totalTopics).toBe(0);
  });

  it('two topics with marks 6 and 8 → mark=7.0, band=good', () => {
    const topicResults: TopicResult[] = [
      { mark: 6, band: 'mid', scoredCount: 2, totalCount: 12 },
      { mark: 8, band: 'high', scoredCount: 3, totalCount: 12 },
    ];
    const result = computeSectionMark(topicResults);
    expect(result.mark).toBeCloseTo(7.0, 5);
    expect(result.band).toBe('good');
    expect(result.scoredTopics).toBe(2);
    expect(result.totalTopics).toBe(2);
  });

  it('one scored topic + one null topic → mean of only the non-null', () => {
    const topicResults: TopicResult[] = [
      { mark: 8, band: 'high', scoredCount: 2, totalCount: 12 },
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
    ];
    const result = computeSectionMark(topicResults);
    expect(result.mark).toBeCloseTo(8.0, 5);
    expect(result.scoredTopics).toBe(1);
    expect(result.totalTopics).toBe(2);
  });

  it('all null topic marks → returns null', () => {
    const topicResults: TopicResult[] = [
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
    ];
    const result = computeSectionMark(topicResults);
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredTopics).toBe(0);
  });
});

describe('computeOverallMark', () => {
  it('no scored topics → returns null', () => {
    const topicResults: TopicResult[] = [
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
    ];
    const result = computeOverallMark(topicResults);
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredTopics).toBe(0);
    expect(result.totalTopics).toBe(2);
  });

  it('empty array input returns null', () => {
    const result = computeOverallMark([]);
    expect(result.mark).toBeNull();
    expect(result.scoredTopics).toBe(0);
    expect(result.totalTopics).toBe(0);
  });

  it('flat list of 3 TopicResults with marks [5, null, 9] → mean of [5,9]=7.0, scoredTopics=2', () => {
    const topicResults: TopicResult[] = [
      { mark: 5, band: 'mid', scoredCount: 1, totalCount: 12 },
      { mark: null, band: 'none', scoredCount: 0, totalCount: 12 },
      { mark: 9, band: 'high', scoredCount: 2, totalCount: 12 },
    ];
    const result = computeOverallMark(topicResults);
    expect(result.mark).toBeCloseTo(7.0, 5);
    expect(result.band).toBe('good');
    expect(result.scoredTopics).toBe(2);
    expect(result.totalTopics).toBe(3);
  });

  it('mean-of-topics (not mean-of-groups): backend group (22 topics) outweighs design group (5 topics)', () => {
    // Simulate 5 design topics all at mark=10, 22 backend topics all at mark=0
    // mean-of-topics: (5*10 + 22*0) / 27 = 50/27 ≈ 1.85 → 'low'
    // mean-of-groups would be: (10 + 0) / 2 = 5.0 → 'mid'
    const designTopics: TopicResult[] = Array.from({ length: 5 }, () => ({
      mark: 10,
      band: 'high' as const,
      scoredCount: 1,
      totalCount: 12,
    }));
    const backendTopics: TopicResult[] = Array.from({ length: 22 }, () => ({
      mark: 0,
      band: 'low' as const,
      scoredCount: 1,
      totalCount: 12,
    }));
    const result = computeOverallMark([...designTopics, ...backendTopics]);
    expect(result.mark).toBeCloseTo(50 / 27, 5);
    expect(result.band).toBe('low');
    expect(result.scoredTopics).toBe(27);
    expect(result.totalTopics).toBe(27);
  });
});

describe('getMarkBand — CONTEXT.md thresholds', () => {
  it('null → none', () => expect(getMarkBand(null)).toBe('none'));
  it('0 → low', () => expect(getMarkBand(0)).toBe('low'));
  it('4.99 → low', () => expect(getMarkBand(4.99)).toBe('low'));
  it('5.0 → mid', () => expect(getMarkBand(5.0)).toBe('mid'));
  it('6.49 → mid', () => expect(getMarkBand(6.49)).toBe('mid'));
  it('6.5 → good', () => expect(getMarkBand(6.5)).toBe('good'));
  it('7.99 → good', () => expect(getMarkBand(7.99)).toBe('good'));
  it('8.0 → high', () => expect(getMarkBand(8.0)).toBe('high'));
  it('10 → high', () => expect(getMarkBand(10)).toBe('high'));
});
