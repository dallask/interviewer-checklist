import type {
  Difficulty,
  Question,
  Section,
  Topic,
} from '../data/bank/types.js';
import type { CustomQuestion } from '../storage/types.js';

// Re-export types used by consumers
export type { Question, Section, Topic };

export type SectionRow = {
  type: 'section';
  id: string;
  label: string;
  icon: string;
  questionCount: number;
};

export type TopicRow = {
  type: 'topic';
  sectionId: string;
  topic: Topic;
  questionCount: number;
  /** true when topicOpen[topic.id] is undefined or true (default open) */
  isOpen: boolean;
};

export type QuestionRow = {
  type: 'question';
  sectionId: string;
  topicId: string;
  question: Question;
  /** Original index within topic.questions — used for score key in Phase 5 */
  index: number;
  /** True for user-created custom questions (not in the built-in bank) */
  isCustom?: boolean;
  /** The custom question's storage id (e.g. 'custom-${topicId}-${seq}') */
  customId?: string;
};

export type VirtualRow = SectionRow | TopicRow | QuestionRow;

/**
 * Build a flat array of VirtualRow items for @tanstack/react-virtual.
 *
 * Pure function — no side effects, no imports of React or StorageAdapter.
 *
 * Filter semantics:
 * - selectedSections: empty Set → show all sections; non-empty → show only matching sections
 * - selectedDifficulties: empty Set → show all difficulties; non-empty → show only matching
 * - searchQuery: empty → show all; non-empty → case-insensitive match on topic.name/desc/tag + question.q
 *
 * Collapse semantics:
 * - sectionOpen[id] === false → emit SectionRow, skip all topics for that section
 * - topicOpen[id] === false → emit TopicRow with isOpen=false, skip its questions
 * - topicOpen[id] undefined or true → TopicRow with isOpen=true, include questions
 */
export function buildFlatRows(
  sections: readonly Section[],
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
    const visibleTopics: Array<
      Topic & { filteredQuestions: readonly Question[] }
    > = [];

    for (const topic of section.items) {
      const filteredQuestions = topic.questions.filter((question) => {
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
          question.q.toLowerCase().includes(q);

        return matchesDifficulty && matchesSearch;
      });

      if (filteredQuestions.length > 0) {
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

    // If no visible topics, skip this section entirely
    if (visibleTopics.length === 0) continue;

    const totalQCount = visibleTopics.reduce(
      (sum, t) => sum + t.filteredQuestions.length,
      0,
    );

    rows.push({
      type: 'section',
      id: section.id,
      label: section.label,
      icon: section.icon,
      questionCount: totalQCount,
    });

    // Section collapsed: emit header but skip topics
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

      // Index fix: use indexOf to get the original position in topic.questions
      // (not the filtered-subset position). This ensures score keys are stable
      // regardless of which difficulty filter is active. Phase 5 requirement.
      for (const question of topic.filteredQuestions) {
        const index = topic.questions.indexOf(question);
        rows.push({
          type: 'question',
          sectionId: section.id,
          topicId: topic.id,
          question,
          index,
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
  }

  return rows;
}
