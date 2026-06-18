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
// valibot schemas for V3 types
// ---------------------------------------------------------------------------

/**
 * CandidateDetails schema — all 6 required string fields for a scored interview.
 * Used by V3SessionSchema. V2 used optional fields (CandidateSchema above is kept
 * for migration compatibility).
 */
export const CandidateDetailsSchema = v.object({
  name: v.string(),
  email: v.string(),
  role: v.string(),
  date: v.string(),
  interviewer: v.string(),
  details: v.string(),
});

/**
 * CustomQuestion schema — a user-created question attached to a topic.
 * id follows the pattern: custom-${topicId}-${sequenceNumber}
 */
export const CustomQuestionSchema = v.object({
  id: v.string(),
  topicId: v.string(),
  text: v.string(),
  level: v.union([
    v.literal('novice'),
    v.literal('intermediate'),
    v.literal('advanced'),
    v.literal('expert'),
  ]),
});

/**
 * V3Session schema — the scoring-aware session format introduced in Phase 5.
 * Field renames from V2: questionScore→scores, topicOverride→overrides,
 * questionComment→notes, cardComment→topicNotes.
 * customQuestions is now a flat array (was Record<string, Array<...>>).
 * candidate is nullable (null when no candidate info has been entered).
 */
export const V3SessionSchema = v.object({
  version: v.literal(3),
  id: v.string(),
  scores: v.record(v.string(), v.nullable(v.number())),
  overrides: v.record(v.string(), v.nullable(v.number())),
  notes: v.record(v.string(), v.string()),
  topicNotes: v.record(v.string(), v.string()),
  customQuestions: v.array(CustomQuestionSchema),
  candidate: v.nullable(CandidateDetailsSchema),
});

// ---------------------------------------------------------------------------
// valibot schemas for V4 types
// ---------------------------------------------------------------------------

export const V4QuestionSchema = v.object({
  id: v.string(),
  text: v.string(),
  level: v.union([
    v.literal('novice'),
    v.literal('intermediate'),
    v.literal('advanced'),
    v.literal('expert'),
  ]),
  isDefault: v.boolean(),
});

export const V4TopicSchema = v.object({
  id: v.string(),
  name: v.string(),
  desc: v.string(),
  tag: v.string(),
  isDefault: v.boolean(),
  questions: v.array(V4QuestionSchema),
});

export const V4SectionSchema = v.object({
  id: v.string(),
  label: v.string(),
  icon: v.string(),
  isDefault: v.boolean(),
  topics: v.array(V4TopicSchema),
});

export const V4SessionSchema = v.object({
  version: v.literal(4),
  id: v.string(),
  sections: v.array(V4SectionSchema),
  scores: v.record(v.string(), v.nullable(v.number())),
  overrides: v.record(v.string(), v.nullable(v.number())),
  notes: v.record(v.string(), v.string()),
  topicNotes: v.record(v.string(), v.string()),
  customQuestions: v.array(CustomQuestionSchema),
  candidate: v.nullable(CandidateDetailsSchema),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types (valibot v1 InferOutput API)
// ---------------------------------------------------------------------------

export type V2Session = v.InferOutput<typeof V2SessionSchema>;
export type V2Manifest = v.InferOutput<typeof V2ManifestSchema>;

// V3 types
export type CandidateDetails = v.InferOutput<typeof CandidateDetailsSchema>;
export type CustomQuestion = v.InferOutput<typeof CustomQuestionSchema>;
export type V3Session = v.InferOutput<typeof V3SessionSchema>;

// V4 types
export type V4Question = v.InferOutput<typeof V4QuestionSchema>;
export type V4Topic = v.InferOutput<typeof V4TopicSchema>;
export type V4Section = v.InferOutput<typeof V4SectionSchema>;
export type V4Session = v.InferOutput<typeof V4SessionSchema>;

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

/**
 * Creates an empty V3Session for the given session ID.
 * All record fields are empty objects; customQuestions is an empty array; candidate is null.
 */
export function createDefaultV3Session(id: string): V3Session {
  return {
    version: 3,
    id,
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  };
}

/**
 * Creates an empty V4Session for the given session ID.
 * sections is [] — populated only during migration from V3, not on new session creation.
 * All record fields are empty objects; customQuestions is an empty array; candidate is null.
 */
export function createDefaultV4Session(id: string): V4Session {
  return {
    version: 4,
    id,
    sections: [],
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  };
}
