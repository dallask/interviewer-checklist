import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from './index.js';

const VALID_LEVELS = new Set(['novice', 'intermediate', 'advanced', 'expert']);

describe('DEFAULT_SECTIONS structure', () => {
  it('has exactly 9 groups', () => {
    expect(DEFAULT_SECTIONS).toHaveLength(9);
  });

  it('has exactly 86 topics across all groups', () => {
    const total = DEFAULT_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    expect(total).toBe(86);
  });

  it('has at least 1000 questions across all topics', () => {
    const total = DEFAULT_SECTIONS.reduce(
      (sum, s) => sum + s.items.reduce((ts, t) => ts + t.questions.length, 0),
      0,
    );
    expect(total).toBeGreaterThanOrEqual(1000);
  });

  it('every question has a valid difficulty level', () => {
    DEFAULT_SECTIONS.forEach((s) => {
      s.items.forEach((t) => {
        t.questions.forEach((q) => {
          expect(VALID_LEVELS.has(q.level)).toBe(true);
        });
      });
    });
  });

  it('every group, topic, and question has a non-empty id/q field', () => {
    DEFAULT_SECTIONS.forEach((s) => {
      expect(s.id).toBeTruthy();
      s.items.forEach((t) => {
        expect(t.id).toBeTruthy();
        t.questions.forEach((q) => {
          expect(q.q.length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('every topic id is unique across all sections', () => {
    const ids = DEFAULT_SECTIONS.flatMap((s) => s.items.map((t) => t.id));
    expect(ids.length).toBe(new Set(ids).size);
  });
});
