import { useAppStore } from '../store/app.js';
import type { TopicRow as TopicRowType } from '../utils/buildFlatRows.js';

interface Props {
  row: TopicRowType;
}

export function TopicRow({ row }: Props) {
  const toggleTopic = useAppStore((s) => s.toggleTopic);

  return (
    <button
      type="button"
      aria-expanded={row.isOpen}
      onClick={() => toggleTopic(row.topic.id)}
      className="bg-white dark:bg-gray-900 px-4 py-2 pl-8 font-normal text-sm border-b border-gray-100 dark:border-gray-800 w-full flex items-center justify-between cursor-pointer text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      <span className="flex-1 text-left">{row.topic.name}</span>
      <span className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {row.questionCount} q
        </span>
        <span className="text-gray-400 text-xs">—</span>
      </span>
    </button>
  );
}
