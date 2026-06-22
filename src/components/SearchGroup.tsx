import { ChevronsLeftRight, ChevronsUpDown, Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
import { buildFlatRows } from '../utils/buildFlatRows.js';

export function SearchGroup() {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedDifficulties = useAppStore((s) => s.selectedDifficulties);
  const selectedSections = useAppStore((s) => s.selectedSections);
  const topicOpen = useAppStore((s) => s.topicOpen);
  const sectionOpen = useAppStore((s) => s.sectionOpen);
  // Phase 14: use store sections (V4Section[]) instead of DEFAULT_SECTIONS (Plan 01 pattern)
  const sections = useAppStore((s) => s.sections);
  const removedDefaultQuestionIds = useAppStore(
    (s) => s.removedDefaultQuestionIds,
  );
  const hideMarked = useAppStore((s) => s.hideMarked);
  const setHideMarked = useAppStore((s) => s.setHideMarked);
  const expandAll = useAppStore((s) => s.expandAll);
  const collapseAll = useAppStore((s) => s.collapseAll);
  const anyOpen =
    Object.keys(sectionOpen).length === 0 ||
    sections.some(
      (sec) =>
        sectionOpen[sec.id] !== false ||
        sec.topics.some((t) => topicOpen[t.id] !== false),
    );
  const scores = useAppStore((s) => s.scores);
  const customQuestions = useAppStore((s) => s.customQuestions);
  const [localValue, setLocalValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 150);
  };

  const handleClear = () => {
    setLocalValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchQuery('');
  };

  // WR-01: exclude removed default questions from the total so the baseline
  // count matches the accessible question pool shown in ContentTree.
  const totalQuestions = useMemo(
    () =>
      sections.reduce(
        (acc, s) =>
          acc +
          s.topics.reduce(
            (a, t) =>
              a +
              t.questions.filter((q) => !removedDefaultQuestionIds.has(q.id))
                .length,
            0,
          ),
        0,
      ),
    [sections, removedDefaultQuestionIds],
  );

  // Mirrors App.tsx: a topic is "fully done" when every non-removed question has a numeric score.
  const markedTopicIds = useMemo(() => {
    const marked = new Set<string>();
    for (const section of sections) {
      for (const topic of section.topics) {
        const activeQuestions = topic.questions.filter(
          (q) => !removedDefaultQuestionIds.has(q.id),
        );
        if (activeQuestions.length === 0) continue;
        const allAnswered = activeQuestions.every((q) => {
          const originalIndex = topic.questions.indexOf(q);
          const key = `${topic.id}-q${originalIndex}`;
          return typeof scores[key] === 'number';
        });
        if (allAnswered) marked.add(topic.id);
      }
    }
    return marked;
  }, [scores, sections, removedDefaultQuestionIds]);

  const resultCount = useMemo(
    () =>
      buildFlatRows(sections, topicOpen, sectionOpen, {
        searchQuery,
        selectedDifficulties,
        selectedSections,
        hideMarked,
        markedTopicIds,
        scores,
        customQuestions,
        removedDefaultQuestionIds,
      }).filter((r) => r.type === 'question').length,
    [
      sections,
      searchQuery,
      selectedDifficulties,
      selectedSections,
      topicOpen,
      sectionOpen,
      hideMarked,
      markedTopicIds,
      scores,
      customQuestions,
      removedDefaultQuestionIds,
    ],
  );

  const isFiltered =
    searchQuery.length > 0 ||
    selectedDifficulties.size > 0 ||
    selectedSections.size > 0;

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            aria-label="Search questions"
            placeholder="Search questions…"
            value={localValue}
            onChange={handleChange}
            className="w-full px-3 py-2 pr-8 text-[13px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          {localValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          title={hideMarked ? 'Show all topics' : 'Hide marked topics'}
          aria-label={hideMarked ? 'Show all topics' : 'Hide marked topics'}
          aria-pressed={hideMarked}
          onClick={() => setHideMarked(!hideMarked)}
          className={`p-2 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors duration-150 ${hideMarked ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          {hideMarked ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          title={anyOpen ? 'Collapse all' : 'Expand all'}
          aria-label={anyOpen ? 'Collapse all' : 'Expand all'}
          aria-pressed={!anyOpen}
          onClick={anyOpen ? collapseAll : expandAll}
          className="p-2 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors duration-150"
        >
          {anyOpen ? (
            <ChevronsLeftRight className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        {isFiltered
          ? `Showing ${resultCount.toLocaleString()} of ${totalQuestions.toLocaleString()} questions`
          : `Showing all ${totalQuestions.toLocaleString()} questions`}
      </p>
    </div>
  );
}
