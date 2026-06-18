import { useAppStore } from '../store/app.js';
import type { SectionRow as SectionRowType } from '../utils/buildFlatRows.js';

interface Props {
  row: SectionRowType;
}

export function SectionRow({ row }: Props) {
  const toggleSectionOpen = useAppStore((s) => s.toggleSectionOpen);
  const sectionOpen = useAppStore((s) => s.sectionOpen);
  const removeSection = useAppStore((s) => s.removeSection);

  const isCollapsed = sectionOpen[row.id] === false;

  return (
    <button
      type="button"
      aria-expanded={!isCollapsed}
      onClick={() => toggleSectionOpen(row.id)}
      className="bg-gray-50 dark:bg-gray-800/50 font-semibold text-base border-b border-gray-200 dark:border-gray-700 px-4 py-3 w-full flex items-center justify-between cursor-pointer text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      <span>
        {row.icon} {row.label}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {row.questionCount} questions
        </span>
        {/* HTML: delete button nested inside section toggle button — stopPropagation mitigates toggle side-effect */}
        {row.isDefault === false && (
          <button
            type="button"
            aria-label={`Remove section ${row.label}`}
            onClick={(e) => { e.stopPropagation(); removeSection(row.id); }}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ml-2 print:hidden"
          >
            ×
          </button>
        )}
      </span>
    </button>
  );
}
