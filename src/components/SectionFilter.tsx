import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { MarkBand } from '../scoring/index.js';
import { computeSectionMark, computeTopicMark } from '../scoring/index.js';
import { useAppStore } from '../store/app.js';

// All 5 band color strings declared as complete static literals
// so Tailwind's content scanner includes them at build time.
const BAND_COLORS: Record<MarkBand, string> = {
  none: 'text-gray-400 dark:text-gray-500',
  low: 'text-red-500 dark:text-red-400',
  mid: 'text-yellow-500 dark:text-yellow-400',
  good: 'text-green-600 dark:text-green-400',
  high: 'text-emerald-600 dark:text-emerald-400',
} as const;

export function SectionFilter() {
  const selectedSections = useAppStore((s) => s.selectedSections);
  const toggleSection = useAppStore((s) => s.toggleSection);
  const scores = useAppStore((s) => s.scores);
  const overrides = useAppStore((s) => s.overrides);
  const customQuestions = useAppStore((s) => s.customQuestions);

  return (
    <div className="flex flex-col">
      {DEFAULT_SECTIONS.map((section) => {
        const isSelected = selectedSections.has(section.id);

        // Compute topic marks for all topics in this section
        const topicResults = section.items.map((topic) => {
          // Append custom questions for this topic
          const customQsForTopic = customQuestions
            .filter((cq) => cq.topicId === topic.id)
            .map((cq) => ({ q: cq.text, level: cq.level }));

          const topicWithCustom = {
            ...topic,
            questions: [...topic.questions, ...customQsForTopic],
          };

          return computeTopicMark(
            topicWithCustom,
            scores,
            overrides[topic.id] ?? null,
          );
        });

        const { mark, band } = computeSectionMark(topicResults);
        const colorClass = BAND_COLORS[band];
        const markDisplay = mark !== null ? mark.toFixed(1) : '—';

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
            <span className={`text-xs tabular-nums ml-auto ${colorClass}`}>
              {markDisplay}
            </span>
          </button>
        );
      })}
    </div>
  );
}
