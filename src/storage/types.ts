import * as v from 'valibot';

// ---------------------------------------------------------------------------
// V1Schema — legacy localStorage flat format from prototype (SCHEMA_VERSION 4)
// Phase 3 treats any blob from the prototype as "v1" regardless of version field.
// ---------------------------------------------------------------------------

export interface V1Schema {
  readonly version: number;
  readonly sections: unknown[] | null;
  readonly sectionOpen: Record<string, boolean>;
  readonly cardOpen: Record<string, boolean>;
  readonly topicOverride: Record<string, number>;
  readonly questionScore: Record<string, number>;
  readonly cardComment: Record<string, string>;
  readonly questionComment: Record<string, string>;
  readonly questionNoteOpen: Record<string, boolean>;
  readonly candidate: {
    name?: string;
    email?: string;
    role?: string;
    date?: string;
    interviewer?: string;
    details?: string;
  };
  readonly customQuestions: Record<
    string,
    Array<{ id: number; text: string; level: string }>
  >;
  readonly customSeq: number;
  readonly filters: string[];
  readonly levels: string[];
  readonly search: string;
  readonly hideReviewed: boolean;
  readonly sidebarCollapsed: boolean;
  readonly sidebarGroups: {
    search: boolean;
    difficulty: boolean;
    sections: boolean;
    actions: boolean;
  };
}

// ---------------------------------------------------------------------------
// valibot schemas for V2 types
// ---------------------------------------------------------------------------

export const CandidateSchema = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  role: v.optional(v.string()),
  date: v.optional(v.string()),
  interviewer: v.optional(v.string()),
  details: v.optional(v.string()),
});

export const V2SessionSchema = v.object({
  version: v.literal(2),
  id: v.string(),
  questionScore: v.record(v.string(), v.nullable(v.number())),
  topicOverride: v.record(v.string(), v.nullable(v.number())),
  cardComment: v.record(v.string(), v.string()),
  questionComment: v.record(v.string(), v.string()),
  candidate: CandidateSchema,
  customQuestions: v.record(
    v.string(),
    v.array(
      v.object({
        id: v.number(),
        text: v.string(),
        level: v.string(),
      }),
    ),
  ),
  customSeq: v.number(),
});

export const V2ManifestSchema = v.object({
  version: v.literal(2),
  activeSessionId: v.string(),
  sessions: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types (valibot v1 InferOutput API)
// ---------------------------------------------------------------------------

export type V2Session = v.InferOutput<typeof V2SessionSchema>;
export type V2Manifest = v.InferOutput<typeof V2ManifestSchema>;

// ---------------------------------------------------------------------------
// Factory functions — produce valid default V2 state
// ---------------------------------------------------------------------------

/**
 * Creates a fresh V2Manifest with a single default session.
 * Uses crypto.randomUUID() for session ID (built-in Chrome 92+, no dependency).
 */
export function createDefaultManifest(): V2Manifest {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    version: 2,
    activeSessionId: id,
    sessions: [{ id, name: 'Session 1', createdAt: now, updatedAt: now }],
  };
}

/**
 * Creates an empty V2Session for the given session ID.
 * All Record fields are empty objects; candidate is empty; customSeq is 0.
 */
export function createDefaultSession(id: string): V2Session {
  return {
    version: 2,
    id,
    questionScore: {},
    topicOverride: {},
    cardComment: {},
    questionComment: {},
    candidate: {},
    customQuestions: {},
    customSeq: 0,
  };
}
