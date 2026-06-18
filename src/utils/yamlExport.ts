import { dump } from 'js-yaml';
import type { V4Session } from '../storage/types.js';

/**
 * Export a V4Session to a YAML string in the structural format.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-q${questionIndex}` (0-based index within topic.questions).
 * This matches the store key format confirmed at src/store/app.ts line 68.
 *
 * YAML schema v2 changes (D-05):
 *   - meta.schemaVersion is 2
 *   - Default question entries include text and level alongside index, score, note (YAML-04)
 *   - bank block emitted when removedQuestionIds or addedSections are non-empty (YAML-06)
 *   - Questions in session.removedDefaultQuestionIds are excluded from sections output
 */
export function exportSession(
  session: V4Session,
  sessionName: string,
): string {
  const removedSet = new Set(session.removedDefaultQuestionIds);

  const sections = session.sections.map((section) => ({
    id: section.id,
    label: section.label,
    icon: section.icon,
    topics: section.topics.map((topic) => {
      const topicCustomQs = session.customQuestions.filter(
        (cq) => cq.topicId === topic.id,
      );
      return {
        id: topic.id,
        name: topic.name,
        override: session.overrides[topic.id] ?? null,
        topicNote: session.topicNotes[topic.id] ?? '',
        questions: topic.questions
          .map((question, index) => ({ question, index }))
          .filter(({ question }) => !removedSet.has(question.id))
          .map(({ question, index }) => ({
            index,
            text: question.text,
            level: question.level,
            score: session.scores[`${topic.id}-q${index}`] ?? null,
            note: session.notes[`${topic.id}-q${index}`] ?? '',
          })),
        customQuestions: topicCustomQs.map((cq) => ({
          id: cq.id,
          text: cq.text,
          level: cq.level,
          score: session.scores[cq.id] ?? null,
          note: session.notes[cq.id] ?? '',
        })),
      };
    }),
  }));

  // YAML-06: bank block — emitted only when there are deltas to record
  const removedQuestionIds = [...session.removedDefaultQuestionIds];
  const addedSections = session.sections.filter((s) => !s.isDefault);
  const bank =
    removedQuestionIds.length > 0 || addedSections.length > 0
      ? { removedQuestionIds, addedSections }
      : undefined;

  const doc = {
    meta: {
      schemaVersion: 2,
      sessionName,
      exportedAt: new Date().toISOString(),
    },
    candidate: session.candidate ?? null,
    sections,
    ...(bank !== undefined ? { bank } : {}),
  };

  return dump(doc, { noRefs: true, lineWidth: 80 });
}

/**
 * Build a filesystem-safe filename for the YAML export.
 *
 * Pattern: interview-{sanitizedName}-{YYYY-MM-DD}.yaml
 *
 * Sanitization: removes non-alphanumeric/dash/underscore/dot/space chars,
 * replaces whitespace runs with a single dash, trims leading/trailing dashes,
 * and falls back to 'untitled' when the result is empty (e.g. '   ' or '!!!').
 */
export function buildFilename(sessionName: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safe =
    (
      sessionName
        .replace(/[^a-zA-Z0-9\-_. ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    ) || 'untitled';
  return `interview-${safe}-${date}.yaml`;
}

/**
 * Trigger a browser file download for the given YAML content.
 *
 * Side effect: creates a Blob + object URL, clicks a hidden anchor, then
 * revokes the URL. Not unit-tested (DOM side effect).
 *
 * @param content  YAML string to download
 * @param filename Target filename (e.g. from buildFilename)
 */
export function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
