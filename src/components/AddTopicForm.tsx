import { useState } from 'react';
import { useAppStore } from '../store/app.js';

interface Props {
  sectionId: string;
  onDismiss: () => void;
}

export function AddTopicForm({ sectionId, onDismiss }: Props) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const addTopic = useAppStore((s) => s.addTopic);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === '') return;
    addTopic(sectionId, {
      // WR-04: append random suffix to prevent ID collision on same-ms submits
      id: `custom-topic-${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      desc: desc.trim(),
      tag: '',
      isDefault: false,
      questions: [],
    });
    onDismiss();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 px-8 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 print:hidden"
    >
      <input
        type="text"
        aria-label="Topic name"
        placeholder="Topic name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-sm font-normal border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
      />
      <input
        type="text"
        aria-label="Topic description"
        placeholder="Description (optional)…"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="text-sm font-normal border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-sm bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Add topic
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-3 py-1"
        >
          Discard
        </button>
      </div>
    </form>
  );
}
