import type { QuestionRow } from '../utils/buildFlatRows.js';

interface Props {
  row: QuestionRow;
}

// All 4 difficulty class strings declared as complete string literals
// so Tailwind's content scanner includes them at build time.
// Never use dynamic class construction like "bg-" + level + "-100".
const DIFFICULTY_CLASSES: Record<string, string> = {
  novice:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  novice: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function QuestionCard({ row }: Props) {
  const { question } = row;
  const difficultyClass =
    DIFFICULTY_CLASSES[question.level] ?? DIFFICULTY_CLASSES.novice;
  const difficultyLabel = DIFFICULTY_LABELS[question.level] ?? question.level;

  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 pl-12 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex-1">
          {question.q}
        </span>
        <span
          className={`text-xs font-normal px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyClass}`}
        >
          {difficultyLabel}
        </span>
      </div>
    </div>
  );
}
