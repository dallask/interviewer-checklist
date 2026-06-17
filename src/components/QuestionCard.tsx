import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
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

  // Derive question id: topicId-index (locked key scheme from scoring.ts)
  const questionId = `${row.topicId}-${row.index}`;

  // Granular selectors to avoid re-renders on unrelated state changes
  const score = useAppStore((s) => s.scores[questionId] ?? null);
  const storedNote = useAppStore((s) => s.notes[questionId] ?? '');
  const setScore = useAppStore((s) => s.setScore);
  const setNote = useAppStore((s) => s.setNote);
  const deleteCustomQuestion = useAppStore((s) => s.deleteCustomQuestion);

  const difficultyClass =
    DIFFICULTY_CLASSES[question.level] ?? DIFFICULTY_CLASSES.novice;
  const difficultyLabel = DIFFICULTY_LABELS[question.level] ?? question.level;

  // Notes state — local value for immediate typing feedback; store write is debounced
  const [notesOpen, setNotesOpen] = useState(false);
  const [localNote, setLocalNote] = useState(storedNote);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local note if storedNote changes externally (e.g. session load)
  useEffect(() => {
    setLocalNote(storedNote);
  }, [storedNote]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleNoteChange(value: string) {
    setLocalNote(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNote(questionId, value);
    }, 300);
  }

  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 pl-12 border-b border-gray-100 dark:border-gray-800">
      {/* Question header: text + difficulty pill + custom badge/delete */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex-1">
          {question.q}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Custom badge */}
          {row.isCustom === true && (
            <span className="text-xs font-normal px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              custom
            </span>
          )}
          {/* Difficulty pill */}
          <span
            className={`text-xs font-normal px-2 py-0.5 rounded-full ${difficultyClass}`}
          >
            {difficultyLabel}
          </span>
          {/* Delete button for custom questions */}
          {row.isCustom === true && (
            <button
              type="button"
              aria-label="Delete custom question"
              onClick={() =>
                row.customId != null && deleteCustomQuestion(row.customId)
              }
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ml-2"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Score slider row — always visible (SCORE-01) */}
      <div className="mt-2 flex items-center gap-3 min-h-[44px]">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          aria-label={question.q}
          aria-valuenow={score ?? 0}
          aria-valuemin={0}
          aria-valuemax={10}
          value={score ?? 0}
          onChange={(e) => setScore(questionId, Number(e.target.value))}
          className="flex-1 h-2 accent-blue-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">
          {score !== null ? `${score} / 10` : '— / 10'}
        </span>
      </div>

      {/* Notes section — toggle + textarea (SCORE-03) */}
      <div>
        <button
          type="button"
          aria-expanded={notesOpen}
          aria-controls={`notes-${questionId}`}
          onClick={() => setNotesOpen((prev) => !prev)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none mt-1"
        >
          {notesOpen ? 'Hide notes' : 'Add notes'}
        </button>
        <textarea
          id={`notes-${questionId}`}
          aria-label={`Notes for ${question.q}`}
          value={localNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          hidden={!notesOpen}
          placeholder="Question notes…"
          className="mt-2 w-full resize-y min-h-[80px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />
      </div>
    </div>
  );
}
