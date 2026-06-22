import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V4Section } from '../storage/types.js';
import {
  buildFlatRows,
  type AddSectionTriggerRow,
  type AddTopicTriggerRow,
} from './buildFlatRows.js';

// ---------------------------------------------------------------------------
// V4 test helpers
// ---------------------------------------------------------------------------

/**
 * Convert a legacy Section (items/q) to V4Section (topics/text) for tests.
 * Mirrors the materializeSections logic from v3-to-v4.ts.
 */
function toV4Sections(
  sections: readonly (typeof DEFAULT_SECTIONS)[number][],
): V4Section[] {
  return sections.map((sec) => ({
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

const V4_DEFAULT_SECTIONS = toV4Sections(DEFAULT_SECTIONS);

const emptyFilters = {
  searchQuery: '',
  selectedDifficulties: new Set<string>() as Set<
    import('../data/bank/types.js').Difficulty
  >,
  selectedSections: new Set<string>(),
};

// V4 synthetic section for unit tests (matches V4Section shape)
const syntheticV4Section: V4Section = {
  id: 'test-section',
  label: 'Test Section',
  icon: 'T',
  isDefault: true,
  topics: [
    {
      id: 'test-topic',
      name: 'Test Topic',
      desc: 'desc',
      tag: 'test',
      isDefault: true,
      questions: [
        { id: 'test-topic-q0', text: 'Q0 intermediate', level: 'intermediate', isDefault: true },
        { id: 'test-topic-q1', text: 'Q1 expert', level: 'expert', isDefault: true },
        { id: 'test-topic-q2', text: 'Q2 expert', level: 'expert', isDefault: true },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// New type tests — TASK 1 (RED phase): these will fail until types are added
// ---------------------------------------------------------------------------

describe('buildFlatRows — new row types (add-topic-trigger, add-section-trigger)', () => {
  it('emits add-topic-trigger after all topics in a section', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const triggerRows = rows.filter((r) => r.type === 'add-topic-trigger');
    expect(triggerRows).toHaveLength(1);
    if (triggerRows[0].type === 'add-topic-trigger') {
      expect((triggerRows[0] as AddTopicTriggerRow).sectionId).toBe('test-section');
    }
  });

  it('emits add-section-trigger after all sections', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const triggerRow = rows[rows.length - 1];
    expect(triggerRow.type).toBe('add-section-trigger');
  });

  it('emits exactly one add-section-trigger even with multiple sections', () => {
    const section2: V4Section = {
      ...syntheticV4Section,
      id: 'section-2',
      topics: [
        {
          id: 'topic-2',
          name: 'Topic 2',
          desc: 'desc',
          tag: 'tag',
          isDefault: true,
          questions: [
            { id: 'topic-2-q0', text: 'Q', level: 'novice', isDefault: true },
          ],
        },
      ],
    };
    const rows = buildFlatRows([syntheticV4Section, section2], {}, {}, emptyFilters);
    const sectionTriggers = rows.filter((r) => r.type === 'add-section-trigger');
    expect(sectionTriggers).toHaveLength(1);
  });

  it('emits one add-topic-trigger per section (not per topic)', () => {
    const section2: V4Section = {
      ...syntheticV4Section,
      id: 'section-2',
      topics: [
        {
          id: 'topic-2',
          name: 'Topic 2',
          desc: 'desc',
          tag: 'tag',
          isDefault: true,
          questions: [
            { id: 'topic-2-q0', text: 'Q', level: 'novice', isDefault: true },
          ],
        },
      ],
    };
    const rows = buildFlatRows([syntheticV4Section, section2], {}, {}, emptyFilters);
    const topicTriggers = rows.filter((r) => r.type === 'add-topic-trigger');
    expect(topicTriggers).toHaveLength(2); // one per section
  });

  it('does NOT emit add-topic-trigger for a collapsed section', () => {
    const rows = buildFlatRows(
      [syntheticV4Section],
      {},
      { 'test-section': false },
      emptyFilters,
    );
    const triggerRows = rows.filter((r) => r.type === 'add-topic-trigger');
    expect(triggerRows).toHaveLength(0);
  });

  it('add-section-trigger is still emitted even when all sections are filtered out', () => {
    const rows = buildFlatRows(
      [syntheticV4Section],
      {},
      {},
      {
        ...emptyFilters,
        searchQuery: 'xyzzy_impossible_search_string_abc123',
      },
    );
    const sectionTriggers = rows.filter((r) => r.type === 'add-section-trigger');
    expect(sectionTriggers).toHaveLength(1);
  });
});

describe('buildFlatRows — QuestionRow new fields (questionBankId, isDefaultQuestion)', () => {
  it('QuestionRow for default question has questionBankId set to V4Question.id', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBeGreaterThan(0);
    if (questionRows[0].type === 'question') {
      expect(questionRows[0].questionBankId).toBe('test-topic-q0');
    }
  });

  it('QuestionRow for default question has isDefaultQuestion = true', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBeGreaterThan(0);
    if (questionRows[0].type === 'question') {
      expect(questionRows[0].isDefaultQuestion).toBe(true);
    }
  });

  it('QuestionRow still exposes question.q for backward compat (bridged from text)', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBeGreaterThan(0);
    if (questionRows[0].type === 'question') {
      expect(questionRows[0].question.q).toBe('Q0 intermediate');
    }
  });
});

describe('buildFlatRows — SectionRow.isDefault field', () => {
  it('SectionRow has isDefault: true for a default section', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const sectionRows = rows.filter((r) => r.type === 'section');
    expect(sectionRows.length).toBeGreaterThan(0);
    if (sectionRows[0].type === 'section') {
      expect(sectionRows[0].isDefault).toBe(true);
    }
  });

  it('SectionRow has isDefault: false for a user-added section', () => {
    const userSection: V4Section = {
      id: 'custom-section-1',
      label: 'Custom',
      icon: '🔧',
      isDefault: false,
      topics: [
        {
          id: 'custom-topic-1',
          name: 'Custom Topic',
          desc: 'desc',
          tag: 'tag',
          isDefault: false,
          questions: [
            { id: 'custom-topic-1-q0', text: 'Custom Q', level: 'novice', isDefault: false },
          ],
        },
      ],
    };
    const rows = buildFlatRows([userSection], {}, {}, emptyFilters);
    const sectionRows = rows.filter((r) => r.type === 'section');
    expect(sectionRows.length).toBe(1);
    if (sectionRows[0].type === 'section') {
      expect(sectionRows[0].isDefault).toBe(false);
    }
  });
});

describe('buildFlatRows — removedDefaultQuestionIds filter', () => {
  it('skips question whose id is in removedDefaultQuestionIds', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, {
      ...emptyFilters,
      removedDefaultQuestionIds: new Set(['test-topic-q0']),
    });
    const questionRows = rows.filter((r) => r.type === 'question');
    const questionIds = questionRows
      .filter((r) => r.type === 'question')
      .map((r) => (r.type === 'question' ? r.questionBankId : undefined));
    expect(questionIds).not.toContain('test-topic-q0');
  });

  it('includes questions whose id is NOT in removedDefaultQuestionIds', () => {
    const rows = buildFlatRows([syntheticV4Section], {}, {}, {
      ...emptyFilters,
      removedDefaultQuestionIds: new Set(['test-topic-q0']),
    });
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBe(2); // q1 and q2 remain
  });

  it('accepts undefined removedDefaultQuestionIds (backward compat)', () => {
    // No removedDefaultQuestionIds in filters — should not throw
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('buildFlatRows — V4Section (section.topics, not section.items)', () => {
  it('builds rows from V4Section.topics (not .items)', () => {
    // syntheticV4Section uses .topics — if buildFlatRows used .items it would break
    const rows = buildFlatRows([syntheticV4Section], {}, {}, emptyFilters);
    const topicRows = rows.filter((r) => r.type === 'topic');
    expect(topicRows).toHaveLength(1);
    if (topicRows[0].type === 'topic') {
      expect(topicRows[0].topic.id).toBe('test-topic');
    }
  });
});

// ---------------------------------------------------------------------------
// Original tests — updated to use V4Section format
// ---------------------------------------------------------------------------

describe('buildFlatRows — no filters, all open', () => {
  it('returns rows for all sections, topics, and questions', () => {
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    // Should have section + topic + question rows
    // At minimum > 100 rows (we have 9 sections + ~86 topics + ~1067 questions)
    expect(rows.length).toBeGreaterThan(100);
  });

  it('first row is a section row', () => {
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    expect(rows[0].type).toBe('section');
  });

  it('contains section, topic, and question row types', () => {
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const types = new Set(rows.map((r) => r.type));
    expect(types).toContain('section');
    expect(types).toContain('topic');
    expect(types).toContain('question');
  });

  it('row count exceeds total questions (due to section + topic header rows)', () => {
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    // total rows > question rows because of section and topic rows
    expect(rows.length).toBeGreaterThan(questionRows.length);
  });
});

describe('buildFlatRows — selectedDifficulties filter', () => {
  it('filters to only novice questions when selectedDifficulties = {novice}', () => {
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        selectedDifficulties: new Set(['novice']) as Set<
          import('../data/bank/types.js').Difficulty
        >,
      },
    );
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBeGreaterThan(0);
    for (const row of questionRows) {
      if (row.type === 'question') {
        expect(row.question.level).toBe('novice');
      }
    }
  });

  it('no non-novice question rows when filtered to novice only', () => {
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        selectedDifficulties: new Set(['novice']) as Set<
          import('../data/bank/types.js').Difficulty
        >,
      },
    );
    for (const row of rows) {
      if (row.type === 'question') {
        expect(row.question.level).not.toBe('intermediate');
        expect(row.question.level).not.toBe('advanced');
        expect(row.question.level).not.toBe('expert');
      }
    }
  });
});

describe('buildFlatRows — selectedSections filter', () => {
  it('filters to only rows for the selected section', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        selectedSections: new Set([firstSection.id]),
      },
    );
    const sectionRows = rows.filter((r) => r.type === 'section');
    expect(sectionRows.length).toBe(1);
    if (sectionRows[0].type === 'section') {
      expect(sectionRows[0].id).toBe(firstSection.id);
    }
  });

  it('returns no rows for excluded sections', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        selectedSections: new Set([firstSection.id]),
      },
    );
    for (const row of rows) {
      if (row.type === 'topic' || row.type === 'question') {
        expect(row.sectionId).toBe(firstSection.id);
      }
    }
  });
});

describe('buildFlatRows — search filter', () => {
  it('returns non-empty results for "react" search (case-insensitive)', () => {
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        searchQuery: 'react',
      },
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it('all remaining question rows contain "react" in name/desc/tag/question text', () => {
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        searchQuery: 'react',
      },
    );
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows.length).toBeGreaterThan(0);
    // Each question row must be in a topic that matches, or the question itself matches
    // We check that at least topic rows with no matches don't appear
    const topicRows = rows.filter((r) => r.type === 'topic');
    for (const row of topicRows) {
      if (row.type === 'topic') {
        const q = 'react';
        const topicMatches =
          row.topic.name.toLowerCase().includes(q) ||
          row.topic.desc.toLowerCase().includes(q) ||
          row.topic.tag.toLowerCase().includes(q);
        // Either the topic name/desc/tag matches, or it has visible questions that match
        if (!topicMatches) {
          // Must have visible questions - check the question rows that follow for this topic
          const topicQRows = rows.filter(
            (r) => r.type === 'question' && r.topicId === row.topic.id,
          );
          expect(topicQRows.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('buildFlatRows — collapsed section', () => {
  it('section row is present even when collapsed', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      { [firstSection.id]: false },
      emptyFilters,
    );
    const sectionRow = rows.find(
      (r) => r.type === 'section' && r.id === firstSection.id,
    );
    expect(sectionRow).toBeDefined();
  });

  it('no topic or question rows for collapsed section', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      { [firstSection.id]: false },
      emptyFilters,
    );
    for (const row of rows) {
      if (row.type === 'topic' || row.type === 'question') {
        expect(row.sectionId).not.toBe(firstSection.id);
      }
    }
  });
});

describe('buildFlatRows — collapsed topic', () => {
  it('topic row is present with isOpen=false when topicOpen[id]=false', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.topics[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      { [firstTopic.id]: false },
      {},
      emptyFilters,
    );
    const topicRow = rows.find(
      (r) => r.type === 'topic' && r.topic.id === firstTopic.id,
    );
    expect(topicRow).toBeDefined();
    if (topicRow?.type === 'topic') {
      expect(topicRow.isOpen).toBe(false);
    }
  });

  it('no question rows for collapsed topic', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.topics[0];
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      { [firstTopic.id]: false },
      {},
      emptyFilters,
    );
    for (const row of rows) {
      if (row.type === 'question') {
        expect(row.topicId).not.toBe(firstTopic.id);
      }
    }
  });

  it('topic row has isOpen=true when topicOpen[id] is undefined (default open)', () => {
    const firstSection = V4_DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.topics[0];
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const topicRow = rows.find(
      (r) => r.type === 'topic' && r.topic.id === firstTopic.id,
    );
    expect(topicRow).toBeDefined();
    if (topicRow?.type === 'topic') {
      expect(topicRow.isOpen).toBe(true);
    }
  });
});

describe('buildFlatRows — empty results', () => {
  it('returns only add-section-trigger when impossible filters applied', () => {
    const rows = buildFlatRows(
      V4_DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        searchQuery:
          'xyzzy_impossible_search_string_that_matches_nothing_abc123',
      },
    );
    // With impossible filter: no section rows, but add-section-trigger still emitted
    const nonTriggerRows = rows.filter((r) => r.type !== 'add-section-trigger');
    expect(nonTriggerRows.length).toBe(0);
    expect(rows.length).toBe(1); // only the add-section-trigger
  });
});

describe('buildFlatRows — SectionRow questionCount', () => {
  it('section row questionCount equals total visible questions in section', () => {
    const rows = buildFlatRows(V4_DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const firstSectionRow = rows.find((r) => r.type === 'section');
    if (firstSectionRow?.type === 'section') {
      const questionRows = rows.filter(
        (r) => r.type === 'question' && r.sectionId === firstSectionRow.id,
      );
      expect(firstSectionRow.questionCount).toBe(questionRows.length);
    }
  });
});

describe('buildFlatRows — index fix under difficulty filtering', () => {
  it('QuestionRow.index reflects original topic.questions position when filter hides q0', () => {
    // Build a synthetic V4 section with 3 questions at different difficulty levels
    const v4Section: V4Section = {
      id: 'test-section',
      label: 'Test Section',
      icon: 'T',
      isDefault: true,
      topics: [
        {
          id: 'test-topic',
          name: 'Test Topic',
          desc: 'desc',
          tag: 'test',
          isDefault: true,
          questions: [
            { id: 'test-topic-q0', text: 'Q0 intermediate', level: 'intermediate', isDefault: true },
            { id: 'test-topic-q1', text: 'Q1 expert', level: 'expert', isDefault: true },
            { id: 'test-topic-q2', text: 'Q2 expert', level: 'expert', isDefault: true },
          ],
        },
      ],
    };

    // Filter to expert only — hides q0 (intermediate)
    const rows = buildFlatRows(
      [v4Section],
      {},
      {},
      {
        ...emptyFilters,
        selectedDifficulties: new Set(['expert']) as Set<
          import('../data/bank/types.js').Difficulty
        >,
      },
    );

    const questionRows = rows.filter((r) => r.type === 'question');
    // q1 should have index === 1 (original position in topic.questions)
    // q2 should have index === 2 (original position in topic.questions)
    expect(questionRows).toHaveLength(2);
    if (questionRows[0].type === 'question') {
      expect(questionRows[0].index).toBe(1); // not 0 (original position preserved)
    }
    if (questionRows[1].type === 'question') {
      expect(questionRows[1].index).toBe(2); // not 1 (original position preserved)
    }
  });

  it('QuestionRow.index matches 0-based position with no filter active', () => {
    const v4Section: V4Section = {
      id: 'test-section',
      label: 'Test Section',
      icon: 'T',
      isDefault: true,
      topics: [
        {
          id: 'test-topic',
          name: 'Test Topic',
          desc: 'desc',
          tag: 'test',
          isDefault: true,
          questions: [
            { id: 'test-topic-q0', text: 'Q0', level: 'novice', isDefault: true },
            { id: 'test-topic-q1', text: 'Q1', level: 'intermediate', isDefault: true },
            { id: 'test-topic-q2', text: 'Q2', level: 'expert', isDefault: true },
          ],
        },
      ],
    };

    const rows = buildFlatRows([v4Section], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');

    expect(questionRows).toHaveLength(3);
    for (let i = 0; i < questionRows.length; i++) {
      const row = questionRows[i];
      if (row.type === 'question') {
        expect(row.index).toBe(i);
      }
    }
  });
});

describe('buildFlatRows — hideMarked filter', () => {
  it('hideMarked:true with marked topic hides that topic from output', () => {
    const v4Section: V4Section = {
      id: 'test-section',
      label: 'Test Section',
      icon: 'T',
      isDefault: true,
      topics: [
        {
          id: 'topic-A',
          name: 'Topic A',
          desc: 'desc',
          tag: 'ta',
          isDefault: true,
          questions: [{ id: 'topic-A-q0', text: 'Q0', level: 'novice', isDefault: true }],
        },
        {
          id: 'topic-B',
          name: 'Topic B',
          desc: 'desc',
          tag: 'tb',
          isDefault: true,
          questions: [{ id: 'topic-B-q0', text: 'Q1', level: 'novice', isDefault: true }],
        },
      ],
    };

    const rows = buildFlatRows(
      [v4Section],
      {},
      {},
      {
        ...emptyFilters,
        hideMarked: true,
        markedTopicIds: new Set(['topic-A']),
      },
    );

    const topicRows = rows.filter((r) => r.type === 'topic');
    const topicIds = topicRows
      .filter((r) => r.type === 'topic')
      .map((r) => (r.type === 'topic' ? r.topic.id : ''));
    expect(topicIds).not.toContain('topic-A');
    expect(topicIds).toContain('topic-B');
  });

  it('hideMarked:false allows marked topic to appear in output', () => {
    const v4Section: V4Section = {
      id: 'test-section',
      label: 'Test Section',
      icon: 'T',
      isDefault: true,
      topics: [
        {
          id: 'topic-A',
          name: 'Topic A',
          desc: 'desc',
          tag: 'ta',
          isDefault: true,
          questions: [{ id: 'topic-A-q0', text: 'Q0', level: 'novice', isDefault: true }],
        },
      ],
    };

    const rows = buildFlatRows(
      [v4Section],
      {},
      {},
      {
        ...emptyFilters,
        hideMarked: false,
        markedTopicIds: new Set(['topic-A']),
      },
    );

    const topicRows = rows.filter(
      (r) => r.type === 'topic' && r.topic.id === 'topic-A',
    );
    expect(topicRows).toHaveLength(1);
  });
});

describe('buildFlatRows — BUG-01: empty topic visibility', () => {
  it('includes a topic with no questions so it appears in the tree', () => {
    const emptyTopicSection: V4Section = {
      id: 'sec-empty',
      label: 'Section With Empty Topic',
      icon: 'E',
      isDefault: false,
      topics: [
        {
          id: 'topic-empty',
          name: 'Empty Topic',
          desc: '',
          tag: '',
          isDefault: false,
          questions: [],
        },
      ],
    };
    const rows = buildFlatRows([emptyTopicSection], {}, {}, emptyFilters);
    const topicRow = rows.find((r) => r.type === 'topic' && r.topic.id === 'topic-empty');
    expect(topicRow).toBeDefined();
  });

  it('section containing only empty topic is NOT skipped by section-skip guard', () => {
    const emptyTopicSection: V4Section = {
      id: 'sec-empty2',
      label: 'Section',
      icon: 'S',
      isDefault: false,
      topics: [
        {
          id: 'topic-e',
          name: 'T',
          desc: '',
          tag: '',
          isDefault: false,
          questions: [],
        },
      ],
    };
    const rows = buildFlatRows([emptyTopicSection], {}, {}, emptyFilters);
    const sectionRow = rows.find((r) => r.type === 'section' && r.id === 'sec-empty2');
    expect(sectionRow).toBeDefined();
  });
});
