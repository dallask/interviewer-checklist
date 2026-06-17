import { type RefObject, useEffect } from 'react';
import { useAppStore } from '../store/app.js';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  sessionId: string;
  sessionName: string;
  onDeleted: () => void;
  /** WR-04: ID of the element that should receive focus when this dialog closes.
   *  Should be the trigger that opened this dialog (e.g. the delete button row),
   *  NOT the parent modal's trigger button. */
  focusRestoreId?: string;
}

export function DeleteSessionConfirmDialog({ dialogRef, sessionId, sessionName, onDeleted, focusRestoreId }: Props) {
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
      // WR-02: guard against empty focusable list to prevent TypeError on .focus()
      if (focusable.length === 0) return;
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
      // WR-04: restore focus to the element that triggered THIS dialog (the
      // delete button row), not to the parent session-switcher trigger.
      const restoreId = focusRestoreId ?? 'open-session-switcher';
      document.getElementById(restoreId)?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef, focusRestoreId]);

  const handleDelete = async () => {
    dialogRef.current?.close();
    // WR-01: wrap in try/finally so onDeleted() is always called even if
    // deleteSession throws (e.g. storage failure), preventing the parent modal
    // from staying open with stale state.
    try {
      await deleteSession(sessionId);
    } catch (err) {
      console.error('[DeleteSessionConfirmDialog] deleteSession failed:', err);
    } finally {
      onDeleted();
    }
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
