import { useState } from 'react';
import type { Difficulty } from '../data/bank/types.js';
import { useAppStore } from '../store/app.js';

interface Props {
  topicId: string;
  onDismiss: () => void;
}

export function CustomQuestionForm({ topicId, onDismiss }: Props) {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<Difficulty>('intermediate');
  const addCustomQuestion = useAppStore((s) => s.addCustomQuestion);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (text.trim() === '') return;
    addCustomQuestion({
      id: `custom-${topicId}-${Date.now()}`,
      topicId,
      text: text.trim(),
      level,
    });
    onDismiss();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-8 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3"
    >
      <input
        type="text"
        aria-label="Custom question text"
        placeholder="Enter question…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 w-full"
      />
      <div className="flex items-center gap-3">
        <select
          aria-label="Question difficulty"
          value={level}
          onChange={(e) => setLevel(e.target.value as Difficulty)}
          className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <option value="novice">Beginner (1.00×)</option>
          <option value="intermediate">Intermediate (1.25×)</option>
          <option value="advanced">Advanced (1.50×)</option>
          <option value="expert">Expert (1.75×)</option>
        </select>
        <button
          type="submit"
          className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Add question
        </button>
        <button
          type="button"
          aria-label="Discard question"
          onClick={onDismiss}
          className="text-sm font-normal px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Discard question
        </button>
      </div>
    </form>
  );
}
