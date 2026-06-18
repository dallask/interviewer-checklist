import { DEFAULT_SECTIONS } from '../../data/bank/index.js';
import type { Section } from '../../data/bank/index.js';
import type { V3Session, V4Section, V4Session } from '../types.js';

/**
 * Migrates a V3Session to V4Session format.
 *
 * Key changes from V3 to V4:
 *   - sections: materialized from DEFAULT_SECTIONS (V3 had no sections field)
 *   - scores: keys re-keyed from '${topicId}-N' to '${topicId}-qN' (D-04)
 *   - notes: same re-keying as scores (question-keyed)
 *   - overrides: preserved unchanged (topicId-keyed — no integer suffix)
 *   - topicNotes: preserved unchanged (topicId-keyed — no integer suffix)
 *   - customQuestions: array passed through unchanged
 *   - candidate: null or populated object preserved
 *
 * Input is treated as Readonly to enforce the no-mutation contract.
 * No try/catch — errors surface to the bootstrap() catch block.
 */
export function migrateV3ToV4(session: Readonly<V3Session>): V4Session {
  return {
    version: 4,
    id: session.id,
    sections: materializeSections(DEFAULT_SECTIONS),
    scores: remapScoreKeys(session.scores),
    overrides: session.overrides,
    notes: remapScoreKeys(session.notes),
    topicNotes: session.topicNotes,
    customQuestions: session.customQuestions,
    candidate: session.candidate,
  };
}

/**
 * Deep-copies DEFAULT_SECTIONS into V4Section[] with isDefault:true on every entity.
 * Question IDs follow the stable format '${topicId}-q${idx}' (D-04).
 * Uses explicit map/spread — NOT JSON.parse/stringify (loses types; incorrect for readonly).
 */
function materializeSections(bank: readonly Section[]): V4Section[] {
  return bank.map((sec) => ({
    id: sec.id,
    label: sec.label,
    icon: sec.icon,
    isDefault: true,
    topics: sec.items.map((topic) => ({
      id: topic.id,
      name: topic.name,
      desc: topic.desc,
      tag: topic.tag,
      isDefault: true,
      questions: topic.questions.map((q, idx) => ({
        id: `${topic.id}-q${idx}`,
        text: q.q,
        level: q.level,
        isDefault: true,
      })),
    })),
  }));
}

/**
 * Re-keys '${topicId}-${n}' → '${topicId}-q${n}' for integer-suffix keys.
 * Keys without an integer suffix pass through unchanged.
 * Called for both session.scores and session.notes — both are question-keyed.
 * NOT called for session.overrides or session.topicNotes — those are topicId-keyed.
 */
function remapScoreKeys<T>(record: Record<string, T>): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const match = /^(.+)-(\d+)$/.exec(key);
    result[match ? `${match[1]}-q${match[2]}` : key] = value;
  }
  return result;
}
