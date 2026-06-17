import { type RefObject, useEffect } from 'react';
import { useAppStore } from '../store/app.js';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  sessionId: string;
  sessionName: string;
  onDeleted: () => void;
}

export function DeleteSessionConfirmDialog({ dialogRef, sessionId, sessionName, onDeleted }: Props) {
  const deleteSession = useAppStore((s) => s.deleteSession);

  // Focus trap + focus restore (verbatim from ResetConfirmDialog.tsx)
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
      document.getElementById('open-session-switcher')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  const handleDelete = async () => {
    dialogRef.current?.close();
    await deleteSession(sessionId);
    onDeleted();
  };

  return (
    // T-06-02-02: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-session-dialog-title"
      className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2
        id="delete-session-dialog-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2"
      >
        Delete session?
      </h2>
      <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mb-6">
        &ldquo;{sessionName}&rdquo; will be permanently deleted. An undo option will appear briefly after deletion.
      </p>
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          id="cancel-delete-session"
          onClick={() => dialogRef.current?.close()}
          className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Keep session
        </button>
        <button
          type="button"
          id="confirm-delete-session"
          onClick={() => {
            void handleDelete();
          }}
          className="text-sm font-normal px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Delete session
        </button>
      </div>
    </dialog>
  );
}
