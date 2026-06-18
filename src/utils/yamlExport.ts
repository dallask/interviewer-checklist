import { dump } from 'js-yaml';
import type { Section } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';

/**
 * Export a V3Session to a YAML string in the structural format.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-q${questionIndex}` (0-based index within topic.questions).
 * This matches the store key format confirmed at src/store/app.ts line 68.
 */
export function exportSession(
  session: V3Session,
  sessionName: string,
  sections: readonly Section[],
): string {
  const doc = {
    meta: {
      schemaVersion: 1,
      sessionName,
      exportedAt: new Date().toISOString(),
    },
    candidate: session.candidate ?? null,
    sections: sections.map((section) => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      topics: section.items.map((topic) => {
        const topicCustomQs = session.customQuestions.filter(
          (cq) => cq.topicId === topic.id,
        );
        return {
          id: topic.id,
          name: topic.name,
          override: session.overrides[topic.id] ?? null,
          topicNote: session.topicNotes[topic.id] ?? '',
          questions: topic.questions.map((_, index) => {
            const questionId = `${topic.id}-q${index}`;
            return {
              index,
              score: session.scores[questionId] ?? null,
              note: session.notes[questionId] ?? '',
            };
          }),
          customQuestions: topicCustomQs.map((cq) => ({
            id: cq.id,
            text: cq.text,
            level: cq.level,
            score: session.scores[cq.id] ?? null,
            note: session.notes[cq.id] ?? '',
          })),
        };
      }),
    })),
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
