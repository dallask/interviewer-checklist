import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
import type { VirtualRow } from '../utils/buildFlatRows.js';
import { AddSectionForm } from './AddSectionForm.js';
import { AddTopicForm } from './AddTopicForm.js';
import { QuestionCard } from './QuestionCard.js';
import { SectionRow } from './SectionRow.js';
import { TopicRow } from './TopicRow.js';

// Estimated heights per row type in pixels — measureElement refines these at runtime.
// Conservative estimates for trigger rows cover both trigger and open-form states.
// See RESEARCH.md Pitfall 2: trigger rows must have a height large enough to accommodate
// the inline form when open (addSectionOpen / addTopicOpenFor toggle replaces trigger UI).
const ESTIMATE_SIZE: Record<VirtualRow['type'], number> = {
  section: 52,
  topic: 44,
  question: 72,
  'add-topic-trigger': 120,
  'add-section-trigger': 120,
};

interface Props {
  rows: VirtualRow[];
}

export function ContentTree({ rows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  // addSectionOpen: controls whether the "+ Add section" trigger shows or AddSectionForm renders
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  // addTopicOpenFor: null = no section form open; sectionId = that section's add-topic form is open
  const [addTopicOpenFor, setAddTopicOpenFor] = useState<string | null>(null);
  const candidate = useAppStore((s) => s.candidate);
  const candidateName = candidate?.name ?? '';
  const candidateRole = candidate?.role ?? '';
  const candidateDate = candidate?.date ?? '';

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => ESTIMATE_SIZE[rows[index].type],
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
    useFlushSync: false, // Required for React 19 — see RESEARCH.md Pitfall 4
  });

  // Scroll-after-add: detect when rows grow and scroll the new row into view.
  // prevRowsLengthRef tracks the previous rows.length to detect additions.
  // useEffect runs after the re-render that reflects the new rows, so
  // scrollToIndex targets an index that exists in the virtualizer.
  const prevRowsLengthRef = useRef<number>(rows.length);

  useEffect(() => {
    if (rows.length > prevRowsLengthRef.current) {
      if (addTopicOpenFor !== null) {
        // BUG-02: a topic was added — find the add-topic-trigger for that section
        const topicTriggerIdx = rows.findIndex(
          (r) => r.type === 'add-topic-trigger' && r.sectionId === addTopicOpenFor,
        );
        if (topicTriggerIdx > 0) {
          // New topic row is immediately before the add-topic-trigger
          rowVirtualizer.scrollToIndex(topicTriggerIdx - 1, { align: 'start', behavior: 'auto' });
        }
      } else {
        // BUG-01: a section was added — find the add-section-trigger (always last)
        const triggerIdx = rows.findIndex((r) => r.type === 'add-section-trigger');
        if (triggerIdx > 0) {
          // New section row is immediately before the add-section-trigger
          rowVirtualizer.scrollToIndex(triggerIdx - 1, { align: 'start', behavior: 'auto' });
        }
      }
    }
    prevRowsLengthRef.current = rows.length;
  }, [rows, rowVirtualizer, addTopicOpenFor]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      {/* Print-only candidate header — hidden on screen (screen users already
          see candidate details via the modal). Appears above the question
          list on the printed page. */}
      <div aria-hidden="true" className="hidden print:block print:mb-4">
        <h1 className="text-xl font-semibold">
          {candidateName || 'Interview Session'}
        </h1>
        <p className="text-[13px] text-gray-600">
          {candidateRole}
          {candidateRole && candidateDate ? ' — ' : ''}
          {candidateDate}
        </p>
      </div>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {row.type === 'section' && <SectionRow row={row} />}
              {row.type === 'topic' && <TopicRow row={row} />}
              {row.type === 'question' && <QuestionCard row={row} />}
              {row.type === 'add-section-trigger' && (
                addSectionOpen ? (
                  <AddSectionForm onDismiss={() => setAddSectionOpen(false)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddSectionOpen(true)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-4 py-1.5 print:hidden"
                  >
                    + Add section
                  </button>
                )
              )}
              {row.type === 'add-topic-trigger' && (
                addTopicOpenFor === row.sectionId ? (
                  <AddTopicForm
                    sectionId={row.sectionId}
                    onDismiss={() => setAddTopicOpenFor(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddTopicOpenFor(row.sectionId)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-8 py-1.5 print:hidden"
                  >
                    + Add topic
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
