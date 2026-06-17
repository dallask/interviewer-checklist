import { useRef } from 'react';
import { useAppStore } from '../store/app.js';
import { CandidateModal } from './CandidateModal.js';
import { ResetConfirmDialog } from './ResetConfirmDialog.js';

export function ActionsGroup() {
  const expandAll = useAppStore((s) => s.expandAll);
  const collapseAll = useAppStore((s) => s.collapseAll);
  const hideMarked = useAppStore((s) => s.hideMarked);
  const setHideMarked = useAppStore((s) => s.setHideMarked);
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  const candidateDialogRef = useRef<HTMLDialogElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={expandAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Expand all
      </button>
      <button
        type="button"
        onClick={collapseAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Collapse all
      </button>
      <button
        type="button"
        aria-pressed={hideMarked}
        onClick={() => setHideMarked(!hideMarked)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Hide marked topics
      </button>
      <button
        type="button"
        aria-pressed={darkMode}
        onClick={() => setDarkMode(!darkMode)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        {darkMode ? 'Light mode' : 'Dark mode'}
      </button>
      <button
        type="button"
        id="open-candidate-modal"
        onClick={() => candidateDialogRef.current?.showModal()}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Candidate details
      </button>
      <button
        type="button"
        id="open-reset-dialog"
        onClick={() => resetDialogRef.current?.showModal()}
        className="w-full text-sm px-3 py-2 text-left text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Reset all
      </button>
      <CandidateModal dialogRef={candidateDialogRef} />
      <ResetConfirmDialog dialogRef={resetDialogRef} />
    </div>
  );
}
