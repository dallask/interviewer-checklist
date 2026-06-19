import { Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../data/bank/types.js';
import { useAppStore } from '../store/app.js';
import type { QuestionRow } from '../utils/buildFlatRows.js';

// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const BORDER_CLASSES: Record<Difficulty, string> = {
  novice: 'border-l-4 border-green-500',
  intermediate: 'border-l-4 border-blue-500',
  advanced: 'border-l-4 border-orange-500',
  expert: 'border-l-4 border-pink-500',
};

// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const BADGE_CLASSES: Record<Difficulty, string> = {
  novice:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

interface Props {
  row: QuestionRow;
}

export function QuestionCard({ row }: Props) {
  const { question } = row;

  // Derive question id: topicId-qIndex (V4 key scheme, D-04)
  const questionId = `${row.topicId}-q${row.index}`;

  // Granular selectors to avoid re-renders on unrelated state changes
  const score = useAppStore((s) => s.scores[questionId] ?? null);
  const storedNote = useAppStore((s) => s.notes[questionId] ?? '');
  const setScore = useAppStore((s) => s.setScore);
  const setNote = useAppStore((s) => s.setNote);
  const deleteCustomQuestion = useAppStore((s) => s.deleteCustomQuestion);
  const removeDefaultQuestion = useAppStore((s) => s.removeDefaultQuestion);
  // printMode is set true by usePrintExpansion's beforeprint handler so that
  // notes textareas with content are revealed for print (the HTML `hidden`
  // attribute cannot be overridden by CSS print:* variants — see
  // 09-RESEARCH.md Pitfall 5).
  const printMode = useAppStore((s) => s.printMode);
  // hideNotes suppresses all note areas globally (UI-09). Not persisted (D-07).
  // Print mode takes priority: hideNotes && !printMode (D-08).
  const hideNotes = useAppStore((s) => s.hideNotes);

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
    <div
      className={`bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 motion-safe:animate-[fade-in_150ms_ease-out] ${BORDER_CLASSES[question.level]}`}
    >
      {/* Single-line compact row — hidden on print */}
      <div className="px-3 py-1.5 pl-10 flex items-center gap-2 min-h-[44px] group print:hidden">
        {/* Score dropdown (left) */}
        <select
          aria-label={`${question.q} score`}
          value={score !== null ? String(score) : 'skip'}
          onChange={(e) => {
            const v = e.target.value;
            setScore(questionId, v === 'skip' ? null : Number(v));
          }}
          className="text-xs font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 min-w-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
        >
          <option value="skip">Skip</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </select>

        {/* Question text (flex-1, truncates) */}
        <span className="text-[13px] font-normal text-gray-900 dark:text-gray-100 flex-1 truncate">
          {question.q}
        </span>

        {/* Difficulty badge — always visible, VIS-02 */}
        <span
          role="img"
          aria-label={`${question.level} difficulty`}
          className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
        >
          {question.level}
        </span>

        {/* Custom badge — shown only for custom questions */}
        {row.isCustom === true && (
          <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
            custom
          </span>
        )}

        {/* Note icon button (right) */}
        <button
          type="button"
          aria-label={`Toggle note for ${question.q}`}
          aria-expanded={notesOpen}
          aria-controls={`notes-${questionId}`}
          onClick={() => setNotesOpen((prev) => !prev)}
          className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${notesOpen || localNote ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Delete button — custom and default questions only, hover-revealed */}
        {(row.isCustom === true || row.isDefaultQuestion === true) && (
          <button
            type="button"
            aria-label={
              row.isCustom ? 'Delete custom question' : 'Remove question'
            }
            onClick={() => {
              if (row.isCustom && row.customId != null) {
                deleteCustomQuestion(row.customId);
              } else if (row.isDefaultQuestion && row.questionBankId != null) {
                removeDefaultQuestion(row.questionBankId);
              }
            }}
            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 print:hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Print-only score readout — replaces the hidden dropdown row on print */}
      <div className="hidden print:flex print:items-center print:gap-2 print:px-3 print:py-1.5 print:pl-10">
        <span className="text-[13px] font-normal text-gray-900">{question.q}</span>
        <span
          aria-hidden="true"
          className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
        >
          {question.level}
        </span>
        <span className="ml-auto text-[13px] font-normal text-gray-700">
          Score: {score !== null ? `${score} / 10` : '— / 10'}
        </span>
      </div>

      {/* Notes section — hideNotes=true hides this wrapper; printMode overrides (D-08) */}
      <div className={hideNotes && !printMode ? 'hidden' : ''}>
        <div
          className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
          style={{ gridTemplateRows: notesOpen || printMode ? '1fr' : '0fr' }}
        >
          <div className="min-h-0">
            <textarea
              id={`notes-${questionId}`}
              aria-label={`Notes for ${question.q}`}
              value={localNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Question notes…"
              className="w-full resize-y min-h-[64px] text-[13px] font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mx-3 mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
              style={{ width: 'calc(100% - 1.5rem)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
