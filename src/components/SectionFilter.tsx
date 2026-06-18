import { useMemo } from 'react';
import { useAppStore } from '../store/app.js';

export function SectionFilter() {
  const selectedSections = useAppStore((s) => s.selectedSections);
  const toggleSection = useAppStore((s) => s.toggleSection);
  const clearSections = useAppStore((s) => s.clearSections);
  const sections = useAppStore((s) => s.sections);
  const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds);

  const sectionCounts = useMemo(
    () =>
      Object.fromEntries(
        sections.map(s => [
          s.id,
          s.topics.reduce(
            (n, t) =>
              n +
              t.questions.filter((q) => !removedDefaultQuestionIds.has(q.id)).length,
            0,
          ),
        ]),
      ),
    [sections, removedDefaultQuestionIds],
  );

  const totalCount = Object.values(sectionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col">
      {/* "All sections" row — pressed when Set is empty */}
      <button
        type="button"
        aria-pressed={selectedSections.size === 0}
        onClick={() => {
          if (selectedSections.size > 0) clearSections();
        }}
        className={`w-full flex items-center px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          selectedSections.size === 0
            ? 'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-l-2 border-transparent'
        }`}
      >
        <span aria-hidden="true" className="mr-1">📋</span>
        <span className="flex-1">All sections</span>
        <span className={`ml-auto text-xs tabular-nums ${
          selectedSections.size === 0
            ? 'text-blue-500 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500'
        }`}>
          {totalCount}
        </span>
      </button>

      {sections.map((section) => {
        const isSelected = selectedSections.has(section.id);

        return (
          <button
            key={section.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              isSelected
                ? 'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-l-2 border-transparent'
            }`}
          >
            <span aria-hidden="true" className="mr-1">{section.icon}</span>
            <span className="flex-1">{section.label}</span>
            <span className={`ml-auto text-xs tabular-nums ${
              isSelected
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {sectionCounts[section.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
