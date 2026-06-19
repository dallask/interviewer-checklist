import { Menu, User } from 'lucide-react';
import {
  computeOverallMark,
  computeTopicMark,
  type MarkBand,
} from '../scoring/index.js';
import { useAppStore } from '../store/app.js';

// All 5 band color strings declared as complete static literals
// so Tailwind's content scanner includes them at build time.
// Never construct classes dynamically (e.g. "text-" + band + "-500").
const BAND_COLORS: Record<MarkBand, string> = {
  none: 'text-gray-400 dark:text-gray-500',
  low: 'text-red-500 dark:text-red-400',
  mid: 'text-yellow-500 dark:text-yellow-400',
  good: 'text-green-600 dark:text-green-400',
  high: 'text-emerald-600 dark:text-emerald-400',
} as const;

export interface SidebarHeaderProps {
  onCandidateClick: () => void;
}

export function SidebarHeader({ onCandidateClick }: SidebarHeaderProps) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sections = useAppStore((s) => s.sections);
  const scores = useAppStore((s) => s.scores);
  const overrides = useAppStore((s) => s.overrides);
  const customQuestions = useAppStore((s) => s.customQuestions);

  // Compute overall mark across all topics in all sections
  const allTopicResults = sections.flatMap((section) =>
    section.topics.map((topic) => {
      const customQsForTopic = customQuestions
        .filter((cq) => cq.topicId === topic.id)
        .map((cq) => ({ q: cq.text, level: cq.level }));

      // Map V4Topic questions to the Question interface { q, level } expected by computeTopicMark
      const topicQuestions = topic.questions.map((q) => ({
        q: q.text,
        level: q.level,
      }));

      const topicWithCustom = {
        id: topic.id,
        name: topic.name,
        desc: topic.desc,
        tag: topic.tag,
        questions: [...topicQuestions, ...customQsForTopic],
      };

      return computeTopicMark(
        topicWithCustom,
        scores,
        overrides[topic.id] ?? null,
      );
    }),
  );

  const { mark, band, scoredTopics, totalTopics } =
    computeOverallMark(allTopicResults);

  const progressPercent =
    totalTopics > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((scoredTopics / totalTopics) * 100)),
        )
      : 0;

  return (
    <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col print:hidden">
      {/* Row 1: toggle + candidate button */}
      <div className="flex items-center gap-2 px-3 py-2 min-h-[44px]">
        <button
          type="button"
          aria-expanded={sidebarOpen}
          aria-label="Close sidebar"
          className="p-2 min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
          onClick={() => setSidebarOpen(false)}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          id="open-candidate-modal"
          aria-label="Candidate details"
          title="Candidate details"
          className="ml-auto p-2 min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
          onClick={onCandidateClick}
        >
          <User className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      {/* Row 2: progress text */}
      <div
        aria-label="Session progress"
        className="px-3 pb-1 flex items-center justify-between gap-2"
      >
        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate">
          Final mark · {scoredTopics}/{totalTopics} topics
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${BAND_COLORS[band]}`}
        >
          {mark !== null ? mark.toFixed(1) : '—'}
        </span>
      </div>
      {/* Row 3: thin progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 mx-3 mb-2 rounded-full">
        <div
          className="h-1 bg-blue-500 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
