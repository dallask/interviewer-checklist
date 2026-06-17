import type { V2Session, V3Session } from '../types.js';

/**
 * Migrates a V2Session to V3Session format.
 *
 * Field renames:
 *   questionScore → scores
 *   topicOverride → overrides
 *   questionComment → notes
 *   cardComment → topicNotes
 *
 * customQuestions: flattened from Record<string, Array<{id,text,level}>> to
 *   CustomQuestion[] using 'custom-${topicId}-${q.id}' as the string id.
 *
 * candidate: null-coalesced — empty {} produces null; populated object is preserved.
 *
 * customSeq is dropped (not present in V3Session shape).
 *
 * Input is treated as Readonly to enforce the no-mutation contract.
 * No try/catch — errors surface to the bootstrap() catch block.
 */
export function migrateV2ToV3(session: Readonly<V2Session>): V3Session {
  return {
    version: 3,
    id: session.id,
    scores: session.questionScore ?? {},
    overrides: session.topicOverride ?? {},
    notes: session.questionComment ?? {},
    topicNotes: session.cardComment ?? {},
    customQuestions: migrateCustomQuestions(session.customQuestions),
    candidate: migrateCandidate(session.candidate),
  };
}

function migrateCustomQuestions(
  customQuestions: V2Session['customQuestions'],
): V3Session['customQuestions'] {
  return Object.entries(customQuestions ?? {}).flatMap(([topicId, qs]) =>
    qs.map((q) => ({
      id: `custom-${topicId}-${q.id}`,
      topicId,
      text: q.text,
      level: q.level as V3Session['customQuestions'][number]['level'],
    })),
  );
}

function migrateCandidate(
  candidate: V2Session['candidate'],
): V3Session['candidate'] {
  if (!candidate || Object.keys(candidate).length === 0) {
    return null;
  }
  return {
    name: candidate.name ?? '',
    email: candidate.email ?? '',
    role: candidate.role ?? '',
    date: candidate.date ?? '',
    interviewer: candidate.interviewer ?? '',
    details: candidate.details ?? '',
  };
}
