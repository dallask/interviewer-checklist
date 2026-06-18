import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
import type { TopicRow as TopicRowType } from '../utils/buildFlatRows.js';
import { CustomQuestionForm } from './CustomQuestionForm.js';
import { TopicMarkDisplay } from './TopicMarkDisplay.js';

interface Props {
  row: TopicRowType;
}

export function TopicRow({ row }: Props) {
  const toggleTopic = useAppStore((s) => s.toggleTopic);
  const removeTopic = useAppStore((s) => s.removeTopic);
  const setTopicNote = useAppStore((s) => s.setTopicNote);
  // printMode is set true by usePrintExpansion's beforeprint handler so that
  // topic notes with content are revealed for print (the HTML `hidden`
  // attribute cannot be overridden by CSS print:* variants — see
  // 09-RESEARCH.md Pitfall 5).
  const printMode = useAppStore((s) => s.printMode);
  // hideNotes suppresses all note areas globally (UI-09). Not persisted (D-07).
  // Print mode takes priority: hideNotes && !printMode (D-08).
  const hideNotes = useAppStore((s) => s.hideNotes);

  const topicId = row.topic.id;

  // Topic notes state
  const storedTopicNote = useAppStore((s) => s.topicNotes[topicId] ?? '');
  const [topicNotesOpen, setTopicNotesOpen] = useState(false);
  const [localTopicNote, setLocalTopicNote] = useState(storedTopicNote);
  const topicNoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Sync local note if store changes externally (e.g. session load)
  useEffect(() => {
    setLocalTopicNote(storedTopicNote);
  }, [storedTopicNote]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (topicNoteDebounceRef.current)
        clearTimeout(topicNoteDebounceRef.current);
    };
  }, []);

  // Add question form state
  const [addQOpen, setAddQOpen] = useState(false);

  function handleTopicNoteChange(value: string) {
    setLocalTopicNote(value);
    if (topicNoteDebounceRef.current)
      clearTimeout(topicNoteDebounceRef.current);
    topicNoteDebounceRef.current = setTimeout(() => {
      setTopicNote(topicId, value);
    }, 300);
  }

  return (
    <div>
      {/* WR-01: topic header — split into container div + toggle button + sibling
           delete button to avoid invalid nested <button> HTML (§4.8.2). */}
      <div className="bg-white dark:bg-gray-900 font-normal text-sm border-b border-gray-100 dark:border-gray-800 w-full flex items-center text-gray-900 dark:text-gray-100 print:px-0 print:pl-0">
        <button
          type="button"
          aria-expanded={row.isOpen}
          onClick={() => toggleTopic(topicId)}
          className="flex-1 flex items-center justify-between px-4 py-2 pl-8 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none text-left print:cursor-default"
        >
          <span className="flex-1 text-left">{row.topic.name}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.questionCount} q
            </span>
            {/* TopicMarkDisplay replaces the Phase 4 "—" stub (SCORE-02) */}
            <TopicMarkDisplay topicId={topicId} topic={row.topic} />
          </span>
        </button>
        {row.topic.isDefault === false && (
          <button
            type="button"
            aria-label={`Remove topic ${row.topic.name}`}
            onClick={() => removeTopic(row.topic.id)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-4 py-2 print:hidden"
          >
            ×
          </button>
        )}
      </div>

      {/* Topic notes panel — outside the button for correct semantics (SCORE-03) */}
      {/* hideNotes=true hides this panel; printMode overrides to keep notes visible (D-08) */}
      <div className={`px-8 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 print:px-0 print:py-1 print:border-0${hideNotes && !printMode ? ' hidden' : ''}`}>
        <button
          type="button"
          aria-expanded={topicNotesOpen}
          aria-controls={`topic-notes-${topicId}`}
          onClick={() => setTopicNotesOpen((prev) => !prev)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none print:hidden"
        >
          {topicNotesOpen ? 'Hide topic notes' : 'Add topic notes'}
        </button>
        <textarea
          id={`topic-notes-${topicId}`}
          aria-label={`Notes for ${row.topic.name}`}
          value={localTopicNote}
          onChange={(e) => handleTopicNoteChange(e.target.value)}
          hidden={!topicNotesOpen && !localTopicNote && !printMode}
          placeholder="Topic notes…"
          className="mt-2 w-full resize-y min-h-[80px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
        />
      </div>

      {/* Add custom question trigger and inline form (SCORE-05) */}
      {addQOpen ? (
        <CustomQuestionForm
          topicId={topicId}
          onDismiss={() => setAddQOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddQOpen(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-8 py-2 print:hidden"
        >
          + Add question
        </button>
      )}
    </div>
  );
}
