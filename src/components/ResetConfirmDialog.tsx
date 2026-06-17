import { type RefObject, useEffect } from 'react';
import { storageAdapter } from '../storage/index.js';
import { useAppStore } from '../store/app.js';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function ResetConfirmDialog({ dialogRef }: Props) {
  const resetAll = useAppStore((s) => s.resetAll);
  const activeSessionId = useAppStore((s) => s.activeSessionId);

  // Focus trap: query inside handler each time (dynamic state safety)
  useEffect(() => {
    const maybeDialog = dialogRef.current;
    if (!maybeDialog) return;
    // Assign to const with non-null type so TypeScript preserves narrowing in closures
    const dialogEl: HTMLDialogElement = maybeDialog;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function handleClose() {
      document.getElementById('open-reset-dialog')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  function handleKeep() {
    dialogRef.current?.close();
  }

  // T-05-03-03: snapshot MUST be awaited before resetAll to prevent race condition
  const handleReset = async () => {
    await storageAdapter.snapshot(activeSessionId);
    resetAll();
    dialogRef.current?.close();
  };

  return (
    // T-05-03-04: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2
        id="reset-dialog-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        Reset all scores?
      </h2>
      <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mb-6">
        This will clear all scores, notes, overrides, custom questions,
        candidate details, and active filters. This cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleKeep}
          className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Keep scores
        </button>
        <button
          type="button"
          onClick={() => {
            void handleReset();
          }}
          className="text-sm font-normal px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Reset
        </button>
      </div>
    </dialog>
  );
}
