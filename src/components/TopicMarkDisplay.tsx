import { useEffect, useState } from 'react';
import type { Topic } from '../data/bank/types.js';
import {
  computeTopicMark,
  getMarkBand,
  type MarkBand,
} from '../scoring/index.js';
import { useAppStore } from '../store/app.js';

interface Props {
  topicId: string;
  topic: Topic;
}

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

export function TopicMarkDisplay({ topicId, topic }: Props) {
  const scores = useAppStore((s) => s.scores);
  const override = useAppStore((s) => s.overrides[topicId] ?? null);
  const setOverride = useAppStore((s) => s.setOverride);
  const customQuestions = useAppStore((s) => s.customQuestions);

  // Build topic with custom questions appended for scoring
  const customQsForTopic = customQuestions
    .filter((cq) => cq.topicId === topicId)
    .map((cq) => ({ q: cq.text, level: cq.level }));

  const topicWithCustom: Topic = {
    ...topic,
    questions: [...topic.questions, ...customQsForTopic],
  };

  const { mark, band } = computeTopicMark(topicWithCustom, scores, override);

  // Local state for the override input value for controlled rendering
  const [overrideInput, setOverrideInput] = useState<string>(
    override !== null ? String(override) : '',
  );

  // Re-sync overrideInput when override changes externally (session switch, undo-delete, YAML import)
  useEffect(() => {
    setOverrideInput(override !== null ? String(override) : '');
  }, [override]);

  const displayBand = override !== null ? getMarkBand(override) : band;
  const colorClass = BAND_COLORS[displayBand];

  const displayValue =
    override !== null
      ? override.toFixed(1)
      : mark !== null
        ? mark.toFixed(1)
        : '—';

  function handleOverrideBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Use controlled state (overrideInput) OR fallback to e.target.value
    const val = e.target.value;
    if (val === '' || val.trim() === '') {
      setOverride(topicId, null);
      return;
    }
    const n = parseFloat(val);
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      // Non-numeric input — no dispatch, leave as-is
      return;
    }
    const clamped = Math.min(10, Math.max(0, n));
    setOverride(topicId, clamped);
  }

  return (
    <fieldset
      className="flex items-center gap-1 border-0 p-0 m-0"
      aria-label={`Mark for ${topic.name}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Computed mark or override value */}
      <span className={`text-xs tabular-nums ${colorClass}`}>
        {displayValue}
      </span>

      {/* Override number input — narrow, no placeholder text (aria-label covers accessibility) */}
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        aria-label={`Override mark for ${topic.name}`}
        value={overrideInput}
        onChange={(e) => setOverrideInput(e.target.value)}
        onBlur={handleOverrideBlur}
        className="w-12 text-xs text-gray-700 dark:text-gray-300 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      />

      {/* Clear override button — visible only when override is set */}
      {override !== null && (
        <button
          type="button"
          aria-label={`Clear override mark for ${topic.name}`}
          onClick={() => {
            setOverride(topicId, null);
            setOverrideInput('');
          }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          ×
        </button>
      )}
    </fieldset>
  );
}
