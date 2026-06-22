import type { Difficulty } from '../data/bank/types.js';
import type { CustomQuestion, V4Section, V4Topic } from '../storage/types.js';

// ---------------------------------------------------------------------------
// VirtualRow types
// ---------------------------------------------------------------------------

export type SectionRow = {
  type: 'section';
  id: string;
  label: string;
  icon: string;
  /** True for sections from the default bank; false for user-added sections */
  isDefault: boolean;
  questionCount: number;
  isOpen: boolean;
};

export type TopicRow = {
  type: 'topic';
  sectionId: string;
  /** V4Topic — has id, name, desc, tag, isDefault, questions: V4Question[] */
  topic: V4Topic;
  questionCount: number;
  /** true when topicOpen[topic.id] is undefined or true (default open) */
  isOpen: boolean;
};

export type QuestionRow = {
  type: 'question';
  sectionId: string;
  topicId: string;
  /** Bridge: exposes .q and .level for QuestionCard backward compat (q = V4Question.text) */
  question: { q: string; level: Difficulty };
  /** Original index within topic.questions — used for score key */
  index: number;
  /** True for user-created custom questions (not in the built-in bank) */
  isCustom?: boolean;
  /** The custom question's storage id (e.g. 'custom-${topicId}-${seq}') */
  customId?: string;
  /** V4Question.id for default questions; undefined for custom questions */
  questionBankId?: string;
  /** True for default questions from bank; false/undefined for custom questions */
  isDefaultQuestion?: boolean;
};

/**
 * Emitted once per section, after all topics for that section.
 * Triggers the "+ Add topic" inline form in ContentTree.
 */
export type AddTopicTriggerRow = {
  type: 'add-topic-trigger';
  sectionId: string;
};

/**
 * Emitted once after all sections.
 * Triggers the "+ Add section" inline form in ContentTree.
 */
export type AddSectionTriggerRow = {
  type: 'add-section-trigger';
};

export type VirtualRow =
  | SectionRow
  | TopicRow
  | QuestionRow
  | AddTopicTriggerRow
  | AddSectionTriggerRow;

/**
 * Build a flat array of VirtualRow items for @tanstack/react-virtual.
 *
 * Pure function — no side effects, no imports of React or StorageAdapter.
 *
 * Filter semantics:
 * - selectedSections: empty Set → show all sections; non-empty → show only matching sections
 * - selectedDifficulties: empty Set → show all difficulties; non-empty → show only matching
 * - searchQuery: empty → show all; non-empty → case-insensitive match on topic.name/desc/tag + question.text
 * - removedDefaultQuestionIds: skip questions whose V4Question.id is in this Set (D-08)
 *
 * Collapse semantics:
 * - sectionOpen[id] === false → emit SectionRow, skip all topics for that section
 * - topicOpen[id] === false → emit TopicRow with isOpen=false, skip its questions
 * - topicOpen[id] undefined or true → TopicRow with isOpen=true, include questions
 *
 * New row emission:
 * - add-topic-trigger: emitted once per section (after all topics), only when section is not collapsed
 * - add-section-trigger: emitted once after all sections (always, even if no sections are visible)
 */
export function buildFlatRows(
  sections: readonly V4Section[],
  topicOpen: Record<string, boolean>,
  sectionOpen: Record<string, boolean>,
  filters: {
    searchQuery: string;
    selectedDifficulties: Set<Difficulty>;
    selectedSections: Set<string>;
    /** When true, topics whose id is in markedTopicIds are omitted from output */
    hideMarked?: boolean;
    /** Set of topic ids that have been fully marked / reviewed */
    markedTopicIds?: Set<string>;
    /** User-created custom questions to append to their topic's rows */
    customQuestions?: CustomQuestion[];
    /** V4Question IDs to skip (removed default questions, D-08) */
    removedDefaultQuestionIds?: Set<string>;
  },
): VirtualRow[] {
  const rows: VirtualRow[] = [];
  const q = filters.searchQuery.toLowerCase();

  for (const section of sections) {
    // Section-level filter: skip entirely if not in the selected set
    if (
      filters.selectedSections.size > 0 &&
      !filters.selectedSections.has(section.id)
    ) {
      continue;
    }

    // Build list of visible topics with their filtered questions
    // V4Section uses .topics (not .items); V4Question uses .text and .level (not .q)
    const visibleTopics: Array<
      V4Topic & { filteredQuestions: { id: string; text: string; level: Difficulty; isDefault: boolean; originalIndex: number }[] }
    > = [];

    for (const topic of section.topics) {
      const filteredQuestions: { id: string; text: string; level: Difficulty; isDefault: boolean; originalIndex: number }[] = [];

      for (let idx = 0; idx < topic.questions.length; idx++) {
        const question = topic.questions[idx];

        // Skip removed default questions (D-08, T-14-03)
        if (filters.removedDefaultQuestionIds?.has(question.id)) continue;

        // Difficulty filter
        const matchesDifficulty =
          filters.selectedDifficulties.size === 0 ||
          filters.selectedDifficulties.has(question.level);

        // Search filter — case-insensitive; checks topic fields and question text
        const matchesSearch =
          !q ||
          topic.name.toLowerCase().includes(q) ||
          topic.desc.toLowerCase().includes(q) ||
          topic.tag.toLowerCase().includes(q) ||
          question.text.toLowerCase().includes(q);

        if (matchesDifficulty && matchesSearch) {
          filteredQuestions.push({ ...question, originalIndex: idx });
        }
      }

      if (filteredQuestions.length > 0 || topic.questions.length === 0) {
        // hideMarked: skip topics that are fully marked when the filter is active
        if (
          filters.hideMarked === true &&
          filters.markedTopicIds?.has(topic.id)
        ) {
          continue;
        }
        visibleTopics.push({ ...topic, filteredQuestions });
      }
    }

    // If no visible topics AND the section has topics (all filtered out), skip it.
    // Empty sections (no topics yet) are kept so the user can add topics to them.
    if (visibleTopics.length === 0 && section.topics.length > 0) continue;

    const totalQCount = visibleTopics.length > 0
      ? visibleTopics.reduce((sum, t) => sum + t.filteredQuestions.length, 0)
      : 0;

    rows.push({
      type: 'section',
      id: section.id,
      label: section.label,
      icon: section.icon,
      isDefault: section.isDefault,
      questionCount: totalQCount,
      isOpen: sectionOpen[section.id] !== false,
    });

    // Section collapsed: emit header but skip topics (no add-topic-trigger for collapsed sections)
    if (sectionOpen[section.id] === false) continue;

    for (const topic of visibleTopics) {
      const isOpen = topicOpen[topic.id] !== false; // undefined or true → open

      rows.push({
        type: 'topic',
        sectionId: section.id,
        topic,
        questionCount: topic.filteredQuestions.length,
        isOpen,
      });

      // Topic collapsed: skip questions
      if (!isOpen) continue;

      // Index fix: use originalIndex (pre-computed above) to get the original position
      // in topic.questions, regardless of which difficulty filter is active (Phase 5).
      for (const question of topic.filteredQuestions) {
        rows.push({
          type: 'question',
          sectionId: section.id,
          topicId: topic.id,
          // Bridge: expose .q for QuestionCard backward compat (Q: question.text → question.q)
          question: { q: question.text, level: question.level },
          index: question.originalIndex,
          questionBankId: question.id,
          isDefaultQuestion: question.isDefault,
        });
      }

      // Append custom questions for this topic — always shown when topic is open,
      // not subject to difficulty/search filtering (user explicitly added them).
      const customForTopic = (filters.customQuestions ?? []).filter(
        (cq) => cq.topicId === topic.id,
      );
      for (const cq of customForTopic) {
        rows.push({
          type: 'question',
          sectionId: section.id,
          topicId: topic.id,
          question: { q: cq.text, level: cq.level },
          index: topic.questions.length + customForTopic.indexOf(cq),
          isCustom: true,
          customId: cq.id,
        });
      }
    }

    // Emit add-topic-trigger after all topics for this section (D-03)
    // Only when section is not collapsed (guard already handled above via continue)
    rows.push({ type: 'add-topic-trigger', sectionId: section.id });
  }

  // Emit add-section-trigger after all sections — always, even if no sections are visible (D-03)
  rows.push({ type: 'add-section-trigger' });

  return rows;
}
