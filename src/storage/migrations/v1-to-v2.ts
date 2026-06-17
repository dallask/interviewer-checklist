import type { V1Schema, V2Manifest, V2Session } from '../types.js';

/**
 * Pure migration function: maps a frozen V1Schema blob to the V2 sharded format.
 *
 * Input is treated as Readonly to enforce the no-mutation contract.
 * The caller must Object.freeze() the input before calling this function if
 * mutation detection in tests is required.
 *
 * Returns a {manifest, session} pair ready to write to chrome.storage.local.
 * Session ID is generated with crypto.randomUUID() — no library dependency.
 *
 * No try/catch — errors surface to bootstrap()'s catch block.
 */
export function migrateV1ToV2(raw: Readonly<V1Schema>): {
  manifest: V2Manifest;
  session: V2Session;
} {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const session: V2Session = {
    version: 2,
    id: sessionId,
    questionScore: raw.questionScore ?? {},
    topicOverride: raw.topicOverride ?? {},
    cardComment: raw.cardComment ?? {},
    questionComment: raw.questionComment ?? {},
    candidate: raw.candidate ?? {},
    customQuestions: raw.customQuestions ?? {},
    customSeq: raw.customSeq ?? 0,
  };

  const manifest: V2Manifest = {
    version: 2,
    activeSessionId: sessionId,
    sessions: [
      {
        id: sessionId,
        name: 'Imported Session',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  return { manifest, session };
}
