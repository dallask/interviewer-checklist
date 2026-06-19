import { useState } from 'react';
import { useAppStore } from '../store/app.js';

interface Props {
  onDismiss: () => void;
}

export function AddSectionForm({ onDismiss }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const addSection = useAppStore((s) => s.addSection);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === '') return;
    addSection({
      // WR-04: append random suffix to prevent ID collision on same-ms submits
      id: `custom-section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: name.trim(),
      icon: icon.trim() || '🔧',
      isDefault: false,
      topics: [],
    });
    onDismiss();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 print:hidden"
    >
      <input
        type="text"
        aria-label="Section name"
        placeholder="Section name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-[13px] font-normal border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
      />
      <input
        type="text"
        aria-label="Section emoji icon"
        placeholder="🔧"
        maxLength={2}
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        className="text-[13px] font-normal border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-[13px] bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Add section
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[13px] text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-3 py-1"
        >
          Discard
        </button>
      </div>
    </form>
  );
}
