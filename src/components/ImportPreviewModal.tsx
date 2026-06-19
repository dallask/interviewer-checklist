import { type RefObject, useEffect, useState } from 'react';
import type { ImportPreview } from '../utils/yamlImport.js';

// ImportPreviewModal is purely prop-driven — it does NOT import useAppStore.
// The caller (ActionsGroup, plan 07-03) owns the store interaction.

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  preview: ImportPreview | null;
  onConfirm: (overwriteActive: boolean) => Promise<void>;
}

export function ImportPreviewModal({ dialogRef, preview, onConfirm }: Props) {
  const [overwriteActive, setOverwriteActive] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  // WR-01: prevent double-submit — track whether an async confirm is in flight.
  const [isPending, setIsPending] = useState(false);

  // Reset toggle and error state whenever a different preview is loaded (REFACTOR requirement)
  useEffect(() => {
    setOverwriteActive(false);
    setImportError(null);
    setIsPending(false);
  }, [preview]);

  // Focus trap + focus restore pattern (WR-02 guard from CandidateModal.tsx)
  // Focus restore target: 'open-import-yaml' button in ActionsGroup
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
      // WR-02: guard against empty focusable list
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
      document.getElementById('open-import-yaml')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  const handleConfirm = async () => {
    // WR-01: guard against double-submit (double-click, rapid Enter presses).
    if (isPending) return;
    setIsPending(true);
    try {
      await onConfirm(overwriteActive);
      dialogRef.current?.close();
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    dialogRef.current?.close();
  };

  return (
    // T-05-03-04: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="import-preview-title"
      className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2
        id="import-preview-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        Import YAML
      </h2>

      {preview ? (
        <div className="mb-4 text-[13px] text-gray-700 dark:text-gray-300 space-y-1">
          {preview.sessionName && (
            <p>
              <span className="font-medium">Session:</span> {preview.sessionName}
            </p>
          )}
          <p>Will modify {preview.modifiedCount} questions</p>
          {preview.addedCount > 0 && (
            <p>Add {preview.addedCount} custom questions</p>
          )}
          {preview.unmatchedCount > 0 && (
            <p>{preview.unmatchedCount} unmatched (skipped)</p>
          )}
        </div>
      ) : null}

      {/* Session mode toggle */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          aria-label="Import as new session"
          aria-pressed={!overwriteActive}
          onClick={() => setOverwriteActive(false)}
          className={`flex-1 text-[13px] px-3 py-2 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            !overwriteActive
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          New session
        </button>
        <button
          type="button"
          aria-label="Overwrite active session"
          aria-pressed={overwriteActive}
          onClick={() => setOverwriteActive(true)}
          className={`flex-1 text-[13px] px-3 py-2 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
            overwriteActive
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Overwrite active session
        </button>
      </div>

      {importError && (
        <p
          role="alert"
          className="mb-3 text-[13px] text-red-600 dark:text-red-400"
        >
          {importError}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="text-[13px] font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending || preview === null}
          onClick={() => {
            void handleConfirm();
          }}
          className="text-[13px] font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Importing…' : 'Confirm'}
        </button>
      </div>
    </dialog>
  );
}
