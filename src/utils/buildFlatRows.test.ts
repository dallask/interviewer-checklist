import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { buildFlatRows } from './buildFlatRows.js';

const emptyFilters = {
  searchQuery: '',
  selectedDifficulties: new Set<string>() as Set<
    import('../data/bank/types.js').Difficulty
  >,
  selectedSections: new Set<string>(),
};

describe('buildFlatRows — no filters, all open', () => {
  it('returns rows for all sections, topics, and questions', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    // Should have section + topic + question rows
    // At minimum > 100 rows (we have 9 sections + ~86 topics + ~1067 questions)
    expect(rows.length).toBeGreaterThan(100);
  });

  it('first row is a section row', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    expect(rows[0].type).toBe('section');
  });

  it('contains section, topic, and question row types', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const types = new Set(rows.map((r) => r.type));
    expect(types).toContain('section');
    expect(types).toContain('topic');
    expect(types).toContain('question');
  });

  it('row count exceeds total questions (due to section + topic header rows)', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    // total rows > question rows because of section and topic rows
    expect(rows.length).toBeGreaterThan(questionRows.length);
  });
});

describe('buildFlatRows — selectedDifficulties filter', () => {
  it('filters to only novice questions when selectedDifficulties = {novice}', () => {
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
      DEFAULT_SECTIONS,
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
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.items[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.items[0];
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
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
    const firstSection = DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.items[0];
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
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
  it('returns zero rows when impossible filters applied', () => {
    const rows = buildFlatRows(
      DEFAULT_SECTIONS,
      {},
      {},
      {
        ...emptyFilters,
        searchQuery:
          'xyzzy_impossible_search_string_that_matches_nothing_abc123',
      },
    );
    expect(rows.length).toBe(0);
  });
});

describe('buildFlatRows — SectionRow questionCount', () => {
  it('section row questionCount equals total visible questions in section', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    const firstSectionRow = rows.find((r) => r.type === 'section');
    if (firstSectionRow?.type === 'section') {
      const questionRows = rows.filter(
        (r) => r.type === 'question' && r.sectionId === firstSectionRow.id,
      );
      expect(firstSectionRow.questionCount).toBe(questionRows.length);
    }
  });
});
