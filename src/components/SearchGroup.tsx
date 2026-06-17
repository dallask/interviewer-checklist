import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';
import { buildFlatRows } from '../utils/buildFlatRows.js';

const TOTAL_QUESTIONS = DEFAULT_SECTIONS.reduce(
  (acc, s) => acc + s.items.reduce((a, t) => a + t.questions.length, 0),
  0,
);

export function SearchGroup() {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedDifficulties = useAppStore((s) => s.selectedDifficulties);
  const selectedSections = useAppStore((s) => s.selectedSections);
  const topicOpen = useAppStore((s) => s.topicOpen);
  const sectionOpen = useAppStore((s) => s.sectionOpen);
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

  const resultCount = useMemo(
    () =>
      buildFlatRows(DEFAULT_SECTIONS, topicOpen, sectionOpen, {
        searchQuery,
        selectedDifficulties,
        selectedSections,
      }).filter((r) => r.type === 'question').length,
    [
      searchQuery,
      selectedDifficulties,
      selectedSections,
      topicOpen,
      sectionOpen,
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
      <div className="relative">
        <input
          type="search"
          aria-label="Search questions"
          placeholder="Search questions…"
          value={localValue}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        {localValue && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            ×
          </button>
        )}
      </div>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        {isFiltered
          ? `Showing ${resultCount.toLocaleString()} of ${TOTAL_QUESTIONS.toLocaleString()} questions`
          : `Showing all ${TOTAL_QUESTIONS.toLocaleString()} questions`}
      </p>
    </div>
  );
}
