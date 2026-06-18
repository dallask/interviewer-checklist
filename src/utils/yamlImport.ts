import { load } from 'js-yaml';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { Section } from '../data/bank/types.js';
import { materializeSections } from '../storage/migrations/v3-to-v4.js';
import type { CandidateDetails, CustomQuestion, V4Section } from '../storage/types.js';

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
  /** User-added sections from YAML v2 bank delta (populated by Plan 03 YAML import) */
  sections?: V4Section[];
  /** IDs of removed default questions from YAML v2 bank delta (populated by Plan 03 YAML import) */
  removedDefaultQuestionIds?: string[];
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

  // Extract schemaVersion early — needed to augment topicIdSet before the
  // main sections loop (CR-04: added-section topics must be "known").
  const schemaVersion =
    typeof (obj.meta as Record<string, unknown> | null | undefined)
      ?.schemaVersion === 'number'
      ? ((obj.meta as Record<string, unknown>).schemaVersion as number)
      : 1;

  // Build canonical ID set from sections param for counting
  const topicIdSet = new Set<string>();
  // CR-02: also build a per-topic question count map so we can reject out-of-bounds
  // indices (e.g. index 9999 on a topic with 12 questions) before they reach storage.
  const topicQuestionCount = new Map<string, number>();
  for (const section of sections) {
    for (const topic of section.items) {
      topicIdSet.add(topic.id);
      topicQuestionCount.set(topic.id, topic.questions.length);
    }
  }

  // CR-04: also register topics from bank.addedSections so that the main
  // sections loop treats them as "known" and does not discard their scores,
  // notes, and overrides. This must happen before `incomingSections` is
  // iterated below.
  if (
    schemaVersion >= 2 &&
    obj.bank != null &&
    Array.isArray((obj.bank as Record<string, unknown>).addedSections)
  ) {
    for (const rawSec of (obj.bank as Record<string, unknown>).addedSections as unknown[]) {
      if (rawSec == null || typeof rawSec !== 'object') continue;
      const sec = rawSec as Record<string, unknown>;
      if (!Array.isArray(sec.topics)) continue;
      for (const rawTopic of sec.topics as unknown[]) {
        if (rawTopic == null || typeof rawTopic !== 'object') continue;
        const t = rawTopic as Record<string, unknown>;
        const tid = typeof t.id === 'string' ? t.id : '';
        if (!tid) continue;
        topicIdSet.add(tid);
        const qCount = Array.isArray(t.questions) ? t.questions.length : 0;
        topicQuestionCount.set(tid, qCount);
      }
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
      // WR-03: skip empty-string topicNote to match the sparse behaviour of
      // q.note handling (line ~410) and resetAll() which returns topicNotes: {}.
      // Empty strings are the yamlExport.ts default (topicNotes[id] ?? '') so
      // round-tripping would otherwise inflate storage with '' for every topic.
      if (typeof topic.topicNote === 'string' && topic.topicNote !== '') {
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

          // CR-02: reject indices that exceed the canonical question count for this
          // topic — a crafted YAML with index 9999 would otherwise write an orphan
          // key that is never rendered and never cleaned up by resetAll().
          const maxIndex = topicQuestionCount.get(topicId) ?? 0;
          if (index >= maxIndex) continue;

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
        // WR-02: enforce last-write-wins for duplicate topic IDs. Without this,
        // two YAML entries with the same topic ID accumulate their custom questions
        // (via push) and the ID generator produces identical IDs (same Date.now(),
        // same cqIndex), causing deleteCustomQuestion to silently remove both.
        const priorCount = result.customQuestions.filter(
          (cq) => cq.topicId === topicId,
        ).length;
        result.customQuestions = result.customQuestions.filter(
          (cq) => cq.topicId !== topicId,
        );
        addedCount -= priorCount;

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

          // CR-05: store score/note under the positional key QuestionCard uses:
          // `${topicId}-q${defaultQCount + cqIndex}`. Using newId would make
          // scores unreadable after import because QuestionCard never writes
          // or reads under the newId key space.
          const defaultQCount = topicQuestionCount.get(topicId) ?? 0;
          const positionalKey = `${topicId}-q${defaultQCount + cqIndex}`;
          if (typeof cq.score === 'number') {
            result.scores[positionalKey] = cq.score;
            modifiedCount++;
          }
          // YAML-05: custom question note preserved on import
          if (typeof cq.note === 'string' && cq.note !== '') {
            result.notes[positionalKey] = cq.note;
          }
        });
      }
    }
  }

  // YAML-06: bank delta — only for schemaVersion >= 2
  // (schemaVersion is extracted early above for CR-04 topicIdSet augmentation)
  if (schemaVersion >= 2 && obj.bank != null) {
    const bank = obj.bank as Record<string, unknown>;

    // removedQuestionIds — string[] validation
    if (Array.isArray(bank.removedQuestionIds)) {
      result.removedDefaultQuestionIds = (
        bank.removedQuestionIds as unknown[]
      ).filter((id): id is string => typeof id === 'string');
    }

    // addedSections — validate shape and check for ID collisions (T-14-04)
    if (Array.isArray(bank.addedSections)) {
      const materialized = materializeSections(DEFAULT_SECTIONS);
      const defaultSectionIds = new Set(materialized.map((s) => s.id));
      const addedSections: V4Section[] = [];
      for (const raw of bank.addedSections as unknown[]) {
        if (raw == null || typeof raw !== 'object') continue;
        const s = raw as Record<string, unknown>;
        if (
          typeof s.id !== 'string' ||
          defaultSectionIds.has(s.id)
        ) {
          // T-14-04: skip colliding IDs to prevent default section corruption
          continue;
        }
        // WR-03: validate each topic and question before pushing to prevent
        // malformed YAML entries (missing id/name, non-array questions) from
        // reaching downstream code that assumes well-shaped V4Section data.
        addedSections.push({
          id: s.id,
          label: typeof s.label === 'string' ? s.label : '',
          icon: typeof s.icon === 'string' ? s.icon : '🔧',
          isDefault: false,
          topics: Array.isArray(s.topics)
            ? (s.topics as unknown[]).reduce<V4Section['topics']>((acc, rawTopic) => {
                if (rawTopic == null || typeof rawTopic !== 'object') return acc;
                const t = rawTopic as Record<string, unknown>;
                if (typeof t.id !== 'string' || typeof t.name !== 'string') return acc;
                acc.push({
                  id: t.id,
                  name: t.name,
                  desc: typeof t.desc === 'string' ? t.desc : '',
                  tag: typeof t.tag === 'string' ? t.tag : '',
                  isDefault: false,
                  questions: Array.isArray(t.questions)
                    ? (t.questions as unknown[]).reduce<V4Section['topics'][number]['questions']>(
                        (qs, rawQ) => {
                          if (rawQ == null || typeof rawQ !== 'object') return qs;
                          const qr = rawQ as Record<string, unknown>;
                          if (typeof qr.id !== 'string' || typeof qr.text !== 'string') return qs;
                          qs.push({
                            id: qr.id,
                            text: qr.text,
                            level: ['novice', 'intermediate', 'advanced', 'expert'].includes(
                              qr.level as string,
                            )
                              ? (qr.level as V4Section['topics'][number]['questions'][number]['level'])
                              : 'novice',
                            isDefault: false,
                          });
                          return qs;
                        },
                        [],
                      )
                    : [],
                });
                return acc;
              }, [])
            : [],
        });
      }
      // Build full sections: default materialized sections + added sections
      result.sections = [...materialized, ...addedSections];
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

// ---------------------------------------------------------------------------
// reKeyImportResultToV4 — convert V3-format score/note keys to V4 format
// ---------------------------------------------------------------------------

/**
 * Re-keys an ImportResult's scores and notes from V3 format (${topicId}-N)
 * to V4 format (${topicId}-qN). Called by ActionsGroup after parseLegacy /
 * parseStructural. Does NOT modify the parsers — they remain V3-key-based.
 *
 * - scores: keys matching /^(.+)-(\d+)$/ → '${match[1]}-q${match[2]}'
 * - notes: same re-keying as scores
 * - overrides: NOT re-keyed (topicId keys have no integer suffix)
 * - topicNotes: NOT re-keyed (same reason)
 * - customQuestions: passed through unchanged
 * - Other fields: passed through unchanged
 *
 * Returns a new ImportResult — does not mutate input.
 *
 * D-08 / RESEARCH.md Pattern 4 / PATTERNS.md §yamlImport.ts
 */
export function reKeyImportResultToV4(result: ImportResult): ImportResult {
  function remap<T>(record: Record<string, T>): Record<string, T> {
    const out: Record<string, T> = {};
    for (const [key, value] of Object.entries(record)) {
      const match = !key.startsWith('custom-') && /^(.+)-(\d+)$/.exec(key);
      out[match ? `${match[1]}-q${match[2]}` : key] = value;
    }
    return out;
  }
  return {
    ...result,
    scores: remap(result.scores),
    notes: remap(result.notes),
    // overrides: topicId-keyed — no re-key needed
    // topicNotes: topicId-keyed — no re-key needed
    // customQuestions: custom-* IDs — pass through unchanged
  };
}
