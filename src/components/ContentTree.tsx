import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { VirtualRow } from '../utils/buildFlatRows.js';
import { QuestionCard } from './QuestionCard.js';
import { SectionRow } from './SectionRow.js';
import { TopicRow } from './TopicRow.js';

// Estimated heights per row type in pixels — measureElement refines these at runtime.
// See RESEARCH.md Pitfall 6: use realistic estimates to prevent zero-height collisions.
const ESTIMATE_SIZE: Record<VirtualRow['type'], number> = {
  section: 52,
  topic: 44,
  question: 72,
};

interface Props {
  rows: VirtualRow[];
}

export function ContentTree({ rows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => ESTIMATE_SIZE[rows[index].type],
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
    useFlushSync: false, // Required for React 19 — see RESEARCH.md Pitfall 4
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
