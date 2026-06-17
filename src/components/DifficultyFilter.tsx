import type { Difficulty } from '../data/bank/types.js';
import { useAppStore } from '../store/app.js';

const DIFFICULTIES: Difficulty[] = ['novice', 'intermediate', 'advanced', 'expert'];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  novice: 'Beginner (1.00×)',
  intermediate: 'Intermediate (1.25×)',
  advanced: 'Advanced (1.50×)',
  expert: 'Expert (1.75×)',
};

export function DifficultyFilter() {
  const selectedDifficulties = useAppStore((s) => s.selectedDifficulties);
  const toggleDifficulty = useAppStore((s) => s.toggleDifficulty);

  return (
    <div className="flex flex-col gap-2">
      {DIFFICULTIES.map((difficulty) => {
        const isSelected = selectedDifficulties.has(difficulty);
        return (
          <button
            key={difficulty}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggleDifficulty(difficulty)}
            className={`text-sm px-3 py-1.5 rounded-full text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              isSelected
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </button>
        );
      })}
    </div>
  );
}
