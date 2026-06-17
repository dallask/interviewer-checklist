import { useRef, useState } from 'react';
import type { V2Manifest } from '../storage/types.js';

type SessionMeta = V2Manifest['sessions'][number];

interface Props {
  session: SessionMeta;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SessionRow({ session, isActive, onSwitch, onRename, onDuplicate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  function startRename() {
    setDraft(session.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitRename(e: React.FocusEvent<HTMLInputElement>) {
    // Pitfall 5: don't commit if focus moved within the same <li>
    const li = e.currentTarget.closest('li');
    if (li?.contains(e.relatedTarget as Node)) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelRename();
      return;
    }
    onRename(trimmed);
    setEditing(false);
  }

  function cancelRename() {
    setDraft(session.name);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // triggers blur → commit
    }
    if (e.key === 'Escape') {
      cancelRename();
    }
  }

  // Static class maps — never dynamic Tailwind color construction
  const liClass = isActive
    ? 'bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2 px-4 min-h-[44px] group'
    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2 px-4 min-h-[44px] group';

  const checkmarkClass = isActive
    ? 'w-4 shrink-0 text-xs text-blue-600 dark:text-blue-400'
    : 'w-4 shrink-0 text-xs text-transparent';

  return (
    <li
      id={`session-row-${session.id}`}
      role="option"
      aria-selected={isActive}
      className={liClass}
    >
      <span className={checkmarkClass} aria-hidden="true">
        ✓
      </span>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          maxLength={50}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          aria-label="Rename session"
          className="flex-1 text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        />
      ) : (
        <>
          <button
            type="button"
            aria-label={`Switch to ${session.name}`}
            onClick={onSwitch}
            className="flex-1 text-sm font-normal text-left text-gray-900 dark:text-gray-100 truncate focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:rounded"
          >
            {session.name}
          </button>

          <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:transition-opacity flex items-center gap-1">
            <button
              type="button"
              aria-label={`Rename ${session.name}`}
              onClick={startRename}
              className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              ✎
            </button>
            <button
              type="button"
              aria-label={`Duplicate ${session.name}`}
              onClick={onDuplicate}
              className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              ⧉
            </button>
            <button
              type="button"
              aria-label={`Delete ${session.name}`}
              onClick={onDelete}
              className="p-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              ×
            </button>
          </div>
        </>
      )}
    </li>
  );
}
