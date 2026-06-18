import { useMemo } from 'react';
import type { Difficulty } from '../data/bank/types.js';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';

const DIFFICULTIES: Difficulty[] = [
  'novice',
  'intermediate',
  'advanced',
  'expert',
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};

export function DifficultyFilter() {
  const selectedDifficulties = useAppStore((s) => s.selectedDifficulties);
  const toggleDifficulty = useAppStore((s) => s.toggleDifficulty);
  const clearDifficulties = useAppStore((s) => s.clearDifficulties);

  // D-05: compute counts once at mount; DEFAULT_SECTIONS is a compile-time constant in v1.1
  const questionCounts = useMemo(() => {
    const all = DEFAULT_SECTIONS.flatMap(s => s.items).flatMap(t => t.questions);
    return {
      novice: all.filter(q => q.level === 'novice').length,
      intermediate: all.filter(q => q.level === 'intermediate').length,
      advanced: all.filter(q => q.level === 'advanced').length,
      expert: all.filter(q => q.level === 'expert').length,
    };
  }, []);

  const totalCount =
    questionCounts.novice +
    questionCounts.intermediate +
    questionCounts.advanced +
    questionCounts.expert;

  return (
    <div className="flex flex-col gap-2">
      {/* "All levels" row — D-01: pressed when Set is empty */}
      <button
        type="button"
        aria-pressed={selectedDifficulties.size === 0}
        onClick={() => {
          if (selectedDifficulties.size > 0) clearDifficulties();
        }}
        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-full text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          selectedDifficulties.size === 0
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
        }`}
      >
        <span aria-hidden="true">∞</span>
        All levels
        <span className={`ml-auto text-xs tabular-nums ${
          selectedDifficulties.size === 0
            ? 'text-blue-200 dark:text-blue-300'
            : 'text-gray-400 dark:text-gray-500'
        }`}>
          {totalCount}
        </span>
      </button>

      {DIFFICULTIES.map((difficulty) => {
        const isSelected = selectedDifficulties.has(difficulty);
        return (
          <button
            key={difficulty}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggleDifficulty(difficulty)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-full text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              isSelected
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_CLASSES[difficulty]}`}
            />
            {DIFFICULTY_LABELS[difficulty]}
            <span className={`ml-auto text-xs tabular-nums ${
              isSelected
                ? 'text-blue-200 dark:text-blue-300'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {questionCounts[difficulty]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
