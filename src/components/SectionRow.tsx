import { X } from 'lucide-react';
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
    // WR-01: split into container div + toggle button + sibling delete button
    // to avoid invalid nested <button> HTML (HTML spec §4.8.2 interactive content).
    <div className="bg-gray-50 dark:bg-gray-800/50 font-semibold text-base border-b border-gray-200 dark:border-gray-700 w-full flex items-center text-gray-900 dark:text-gray-100">
      <button
        type="button"
        aria-expanded={!isCollapsed}
        onClick={() => toggleSectionOpen(row.id)}
        className="flex-1 flex items-center justify-between px-4 py-3 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none text-left"
      >
        <span>
          <span aria-hidden="true">{row.icon}</span> {row.label}
        </span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {row.questionCount} questions
        </span>
      </button>
      {row.isDefault === false && (
        <button
          type="button"
          aria-label={`Remove section ${row.label}`}
          onClick={() => removeSection(row.id)}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-4 py-3 print:hidden"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
