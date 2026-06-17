import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';

export function SectionFilter() {
  const selectedSections = useAppStore((s) => s.selectedSections);
  const toggleSection = useAppStore((s) => s.toggleSection);

  return (
    <div className="flex flex-col">
      {DEFAULT_SECTIONS.map((section) => {
        const isSelected = selectedSections.has(section.id);
        return (
          <button
            key={section.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              isSelected
                ? 'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-l-2 border-transparent'
            }`}
          >
            <span className="flex-1">{section.label}</span>
            <span className="text-gray-400 text-xs ml-auto">—</span>
          </button>
        );
      })}
    </div>
  );
}
