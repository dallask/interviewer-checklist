import type { Section } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
import { computeTopicMark } from '../scoring/scoring.js';

/**
 * Narrow interface covering only the fields that buildAiPrompt reads.
 * Using this instead of V3Session avoids requiring `version` and `id`
 * at call sites that assemble the object from store selectors.
 */
export interface AiPromptInput {
  candidate: V3Session['candidate'];
  scores: V3Session['scores'];
  overrides: V3Session['overrides'];
  notes: V3Session['notes'];
  topicNotes: V3Session['topicNotes'];
  customQuestions: V3Session['customQuestions'];
}

/**
 * Build an AI feedback prompt string from session data and section definitions.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-q${questionIndex}` (matches src/store/app.ts line 70).
 * Custom question score key: cq.id (e.g. 'custom-twig-1') — same as store.
 */
export function buildAiPrompt(
  session: AiPromptInput,
  sections: readonly Section[],
): string {
  const lines: string[] = [];

  // ── Block 1: Candidate ──────────────────────────────────────────────────
  const c = session.candidate;
  lines.push('# Interview Feedback Request');
  lines.push('');
  lines.push(`Candidate: ${c?.name || '(not set)'}`);
  lines.push(`Role: ${c?.role || '(not set)'}`);
  lines.push(`Date: ${c?.date || '(not set)'}`);
  lines.push(`Interviewer: ${c?.interviewer || '(not set)'}`);
  if (c?.details) lines.push(`Notes: ${c.details}`);
  lines.push('');

  // ── Block 2: Per-section / per-topic scoring ────────────────────────────
  for (const section of sections) {
    lines.push(`## ${section.label}`);
    lines.push('');

    for (const topic of section.items) {
      const result = computeTopicMark(
        topic,
        session.scores,
        session.overrides[topic.id] ?? undefined,
      );

      // Difficulty note: find highest coefficient across topic questions (one sentence per CONTEXT.md)
      // Guard against empty question arrays: Math.max(...[]) returns -Infinity.
      const coefficients = topic.questions.map((q) => DIFFICULTY_COEFFICIENTS[q.level]);
      const maxCoef = coefficients.length > 0
        ? Math.max(...coefficients)
        : DIFFICULTY_COEFFICIENTS['novice'];
      const diffEntry = Object.entries(DIFFICULTY_COEFFICIENTS).find(
        ([, v]) => v === maxCoef,
      );
      const diffLevel = diffEntry?.[0] ?? 'novice';
      const diffLabel = diffLevel.charAt(0).toUpperCase() + diffLevel.slice(1);

      lines.push(`### ${topic.name}`);

      // Mark line: "No scores yet" when mark is null
      if (result.mark !== null) {
        lines.push(
          `Mark: ${result.mark.toFixed(1)} (${result.scoredCount}/${result.totalCount} scored)`,
        );
      } else {
        lines.push(
          `Mark: No scores yet (${result.scoredCount}/${result.totalCount} scored)`,
        );
      }

      lines.push(`Difficulty: ${diffLabel} — weighted ${maxCoef}×`);
      lines.push('');

      // Bank questions
      topic.questions.forEach((q, index) => {
        const key = `${topic.id}-q${index}`;
        const score = session.scores[key];
        const note = session.notes[key] ?? '';
        const scoreStr = typeof score === 'number' ? String(score) : 'skipped';
        lines.push(`- [${scoreStr}] ${q.q}`);
        if (note) lines.push(`  Note: ${note}`);
      });

      // Custom questions inline after bank questions
      const customs = session.customQuestions.filter(
        (cq) => cq.topicId === topic.id,
      );
      for (const cq of customs) {
        const score = session.scores[cq.id];
        const note = session.notes[cq.id] ?? '';
        const scoreStr = typeof score === 'number' ? String(score) : 'skipped';
        lines.push(`- [${scoreStr}] (custom) ${cq.text}`);
        if (note) lines.push(`  Note: ${note}`);
      }

      // Topic notes (if present)
      if (session.topicNotes[topic.id]) {
        lines.push(`Topic notes: ${session.topicNotes[topic.id]}`);
      }

      lines.push('');
    }
  }

  // ── Block 3: Task spec ──────────────────────────────────────────────────
  lines.push('---');
  lines.push('## Task');
  lines.push(
    'Based on the scored interview above, write a structured feedback summary. ' +
      'Include: overall impression, strongest topics, areas needing improvement, ' +
      'and a hiring recommendation. Use the difficulty weights to contextualize performance.',
  );

  return lines.join('\n');
}
