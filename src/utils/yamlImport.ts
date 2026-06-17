import { load } from 'js-yaml';
import type { Section } from '../data/bank/types.js';
import type { CandidateDetails, CustomQuestion } from '../storage/types.js';

// ---------------------------------------------------------------------------
// Security: maximum YAML file size (1 MB) to prevent DoS via memory allocation.
// Exported so the file-picker caller can check file.size before readAsText().
// T-07-02 mitigation.
// ---------------------------------------------------------------------------
export const MAX_YAML_BYTES = 1_048_576;

// ---------------------------------------------------------------------------
// Result and Preview types
// ---------------------------------------------------------------------------

/**
 * The result of a successful import operation — a flat diff that can be applied
 * to the Zustand store via importSession().
 */
export interface ImportResult {
  scores: Record<string, number | null>;
  overrides: Record<string, number | null>;
  notes: Record<string, string>;
  topicNotes: Record<string, string>;
  customQuestions: CustomQuestion[];
  candidate: CandidateDetails | null;
  sessionName: string;
}

/**
 * Summary counts for the import preview modal plus the full ImportResult
 * so the confirm handler doesn't need to re-parse.
 */
export interface ImportPreview {
  modifiedCount: number;
  addedCount: number;
  unmatchedCount: number;
  sessionName: string;
  result: ImportResult;
}

// ---------------------------------------------------------------------------
// Empty result factory
// ---------------------------------------------------------------------------

function emptyResult(): ImportResult {
  return {
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
    sessionName: '',
  };
}

// ---------------------------------------------------------------------------
// parseYaml — safe wrapper around js-yaml load()
// Returns a discriminated union to avoid thrown errors reaching callers.
// ---------------------------------------------------------------------------

/**
 * Parse a YAML string safely.
 *
 * js-yaml 4.x `load()` uses JSON_SCHEMA by default — no arbitrary JS execution.
 * T-07-01 mitigation.
 */
export function parseYaml(
  text: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: load(text) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// detectFormat — determines whether a parsed YAML object is structural or legacy
// ---------------------------------------------------------------------------

/**
 * Detect the format of a parsed YAML document.
 *
 * - 'structural': the document has a 'sections' key (exported by yamlExport.ts)
 * - 'legacy': the document is an object without a 'sections' key (old progress-only export)
 * - 'unknown': not a plain object (null, array, primitive)
 */
export function detectFormat(
  parsed: unknown,
): 'structural' | 'legacy' | 'unknown' {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'unknown';
  }
  const obj = parsed as Record<string, unknown>;
  return 'sections' in obj ? 'structural' : 'legacy';
}

// ---------------------------------------------------------------------------
// parseLegacy — import a legacy (progress-only) YAML
// ---------------------------------------------------------------------------

/**
 * Parse a legacy YAML object that has a flat `scores` map (no sections key).
 *
 * ID derivation: `${topic.id}-${questionIndex}` (0-based) — matches the live
 * store key format (confirmed at src/store/app.ts line 68 comment).
 *
 * Legacy YAML has no custom questions (addedCount = 0).
 */
export function parseLegacy(
  yamlObj: unknown,
  sections: readonly Section[],
): ImportPreview {
  const result = emptyResult();

  // Guard: must be a plain object
  if (
    typeof yamlObj !== 'object' ||
    yamlObj === null ||
    Array.isArray(yamlObj)
  ) {
    return {
      modifiedCount: 0,
      addedCount: 0,
      unmatchedCount: 0,
      sessionName: '',
      result,
    };
  }

  const obj = yamlObj as Record<string, unknown>;

  // Build canonical ID set from DEFAULT_SECTIONS
  const idSet = new Set<string>();
  for (const section of sections) {
    for (const topic of section.items) {
      topic.questions.forEach((_, index) => {
        idSet.add(`${topic.id}-${index}`);
      });
    }
  }

  // Match incoming scores against canonical IDs
  let modifiedCount = 0;
  let unmatchedCount = 0;

  const incomingScores = obj.scores;
  if (
    typeof incomingScores === 'object' &&
    incomingScores !== null &&
    !Array.isArray(incomingScores)
  ) {
    for (const [key, value] of Object.entries(
      incomingScores as Record<string, unknown>,
    )) {
      if (idSet.has(key)) {
        // WR-03: only store and count numeric values as modified; non-numeric
        // values (strings, booleans) are treated as unmatched to avoid
        // inflating modifiedCount with entries that silently become null.
        const numericValue = typeof value === 'number' ? value : null;
        if (numericValue !== null) {
          result.scores[key] = numericValue;
          modifiedCount++;
        } else if (value !== null) {
          // non-numeric, non-null value in a known key → unmatched
          unmatchedCount++;
        }
        // null values (explicit null in YAML) are silently skipped — no score written
      } else {
        unmatchedCount++;
      }
    }
  }

  // Extract candidate if present
  const incomingCandidate = obj.candidate;
  if (
    typeof incomingCandidate === 'object' &&
    incomingCandidate !== null &&
    !Array.isArray(incomingCandidate)
  ) {
    const c = incomingCandidate as Record<string, unknown>;
    result.candidate = {
      name: typeof c.name === 'string' ? c.name : '',
      email: typeof c.email === 'string' ? c.email : '',
      role: typeof c.role === 'string' ? c.role : '',
      date: typeof c.date === 'string' ? c.date : '',
      interviewer: typeof c.interviewer === 'string' ? c.interviewer : '',
      details: typeof c.details === 'string' ? c.details : '',
    };
  }

  // Extract sessionName
  const meta = obj.meta;
  let sessionName = '';
  if (typeof obj.sessionName === 'string') {
    sessionName = obj.sessionName;
  } else if (
    typeof meta === 'object' &&
    meta !== null &&
    !Array.isArray(meta) &&
    typeof (meta as Record<string, unknown>).sessionName === 'string'
  ) {
    sessionName = (meta as Record<string, unknown>).sessionName as string;
  }
  result.sessionName = sessionName;

  return {
    modifiedCount,
    addedCount: 0,
    unmatchedCount,
    sessionName,
    result,
  };
}

// ---------------------------------------------------------------------------
// parseStructural — import a structural YAML (exported by yamlExport.ts)
// ---------------------------------------------------------------------------

/**
 * Parse a structural YAML object (one with a 'sections' key).
 *
 * Reconstructs scores, overrides, notes, topicNotes, and customQuestions
 * from the nested YAML structure.
 *
 * Duplicate topic IDs: last-write-wins (later entry in sections list overrides).
 */
export function parseStructural(
  yamlObj: unknown,
  sections: readonly Section[],
): ImportPreview {
  const result = emptyResult();

  // Guard: must be a plain object
  if (
    typeof yamlObj !== 'object' ||
    yamlObj === null ||
    Array.isArray(yamlObj)
  ) {
    return {
      modifiedCount: 0,
      addedCount: 0,
      unmatchedCount: 0,
      sessionName: '',
      result,
    };
  }

  const obj = yamlObj as Record<string, unknown>;

  // Build canonical ID set from sections param for counting
  const topicIdSet = new Set<string>();
  for (const section of sections) {
    for (const topic of section.items) {
      topicIdSet.add(topic.id);
    }
  }

  let modifiedCount = 0;
  let addedCount = 0;
  let unmatchedCount = 0;

  // Extract sessionName from meta
  const meta = obj.meta;
  let sessionName = '';
  if (
    typeof meta === 'object' &&
    meta !== null &&
    !Array.isArray(meta)
  ) {
    const metaObj = meta as Record<string, unknown>;
    if (typeof metaObj.sessionName === 'string') {
      sessionName = metaObj.sessionName;
    }
  }
  result.sessionName = sessionName;

  // Extract candidate
  const incomingCandidate = obj.candidate;
  if (
    typeof incomingCandidate === 'object' &&
    incomingCandidate !== null &&
    !Array.isArray(incomingCandidate)
  ) {
    const c = incomingCandidate as Record<string, unknown>;
    result.candidate = {
      name: typeof c.name === 'string' ? c.name : '',
      email: typeof c.email === 'string' ? c.email : '',
      role: typeof c.role === 'string' ? c.role : '',
      date: typeof c.date === 'string' ? c.date : '',
      interviewer: typeof c.interviewer === 'string' ? c.interviewer : '',
      details: typeof c.details === 'string' ? c.details : '',
    };
  }

  // Process sections
  const incomingSections = obj.sections;
  if (!Array.isArray(incomingSections)) {
    return {
      modifiedCount,
      addedCount,
      unmatchedCount,
      sessionName,
      result,
    };
  }

  for (const rawSection of incomingSections) {
    if (
      typeof rawSection !== 'object' ||
      rawSection === null ||
      Array.isArray(rawSection)
    ) {
      continue;
    }

    const section = rawSection as Record<string, unknown>;
    const topics = section.topics;
    if (!Array.isArray(topics)) continue;

    for (const rawTopic of topics) {
      if (
        typeof rawTopic !== 'object' ||
        rawTopic === null ||
        Array.isArray(rawTopic)
      ) {
        continue;
      }

      const topic = rawTopic as Record<string, unknown>;
      const topicId = typeof topic.id === 'string' ? topic.id : '';

      // Track unmatched topics
      const isKnownTopic = topicIdSet.has(topicId);
      if (!isKnownTopic) {
        unmatchedCount++;
        continue;
      }

      // Reconstruct topic-level data (last-write-wins for duplicate topic IDs)
      if (topic.override !== undefined) {
        result.overrides[topicId] =
          typeof topic.override === 'number'
            ? topic.override
            : topic.override === null
              ? null
              : null;
      }
      if (typeof topic.topicNote === 'string') {
        result.topicNotes[topicId] = topic.topicNote;
      }

      // Process questions
      const questions = topic.questions;
      if (Array.isArray(questions)) {
        for (const rawQ of questions) {
          if (
            typeof rawQ !== 'object' ||
            rawQ === null ||
            Array.isArray(rawQ)
          ) {
            continue;
          }
          const q = rawQ as Record<string, unknown>;
          // CR-02: require non-negative integer index to prevent orphan keys like
          // "twig-1.5" or "twig--3" from polluting the scores map permanently.
          const index =
            typeof q.index === 'number' &&
            Number.isInteger(q.index) &&
            q.index >= 0
              ? q.index
              : null;
          if (index === null) continue;

          const questionKey = `${topicId}-${index}`;
          const score =
            typeof q.score === 'number'
              ? q.score
              : q.score === null
                ? null
                : null;

          // WR-04: only write score entries when non-null to keep scores map sparse
          // (matches resetAll() behaviour and avoids inflating chrome.storage.local
          // with null placeholders for every unscored question in the YAML).
          if (score !== null) {
            result.scores[questionKey] = score;
            modifiedCount++;
          }
          if (typeof q.note === 'string' && q.note !== '') {
            result.notes[questionKey] = q.note;
          }
        }
      }

      // Process custom questions
      const customQuestions = topic.customQuestions;
      if (Array.isArray(customQuestions)) {
        customQuestions.forEach((rawCq, cqIndex) => {
          if (
            typeof rawCq !== 'object' ||
            rawCq === null ||
            Array.isArray(rawCq)
          ) {
            return;
          }

          const cq = rawCq as Record<string, unknown>;

          // Generate new ID on import to prevent stale ID collisions on re-import
          const newId = `custom-${topicId}-${Date.now()}-${cqIndex}`;

          const newCq: CustomQuestion = {
            id: newId,
            topicId,
            text: typeof cq.text === 'string' ? cq.text : '',
            level:
              typeof cq.level === 'string' &&
              ['novice', 'intermediate', 'advanced', 'expert'].includes(
                cq.level,
              )
                ? (cq.level as CustomQuestion['level'])
                : 'novice',
          };

          result.customQuestions.push(newCq);
          addedCount++;

          // Store the custom question's score under the new ID
          if (typeof cq.score === 'number') {
            result.scores[newId] = cq.score;
          }
          if (typeof cq.note === 'string' && cq.note !== '') {
            result.notes[newId] = cq.note;
          }
        });
      }
    }
  }

  return {
    modifiedCount,
    addedCount,
    unmatchedCount,
    sessionName,
    result,
  };
}
