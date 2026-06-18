import { type RefObject, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
import { DeleteSessionConfirmDialog } from './DeleteSessionConfirmDialog.js';
import { SessionRow } from './SessionRow.js';
import type { V2Manifest } from '../storage/types.js';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

type SessionMeta = V2Manifest['sessions'][number];

export function SessionSwitcherModal({ dialogRef }: Props) {
  const manifest = useAppStore((s) => s.manifest);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const createSession = useAppStore((s) => s.createSession);
  const switchSession = useAppStore((s) => s.switchSession);
  const renameSession = useAppStore((s) => s.renameSession);
  const duplicateSession = useAppStore((s) => s.duplicateSession);

  const [pendingDelete, setPendingDelete] = useState<SessionMeta | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  // Focus trap + focus restore (verbatim from CandidateModal.tsx)
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
      document.getElementById('open-session-switcher')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  async function handleNewSession() {
    // CR-05: await createSession so rejection is caught rather than silently
    // discarded by void expr.then() — same pattern applied to onSwitch (WR-03).
    try {
      await createSession();
      dialogRef.current?.close();
    } catch (err) {
      console.error('[SessionSwitcherModal] createSession failed:', err);
    }
  }

  return (
    // T-06-02-02: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="session-switcher-title"
      className="fixed inset-0 m-auto w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-0"
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          dialogRef.current.close();
        }
      }}
    >
      <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2
          id="session-switcher-title"
          className="text-base font-semibold text-gray-900 dark:text-gray-100"
        >
          Sessions
        </h2>
        <button
          type="button"
          aria-label="Close sessions"
          id="close-session-switcher"
          onClick={() => dialogRef.current?.close()}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          ×
        </button>
      </div>

      {/* Session list */}
      <ul
        aria-label="Sessions"
        className="flex-1 overflow-y-auto max-h-[352px] py-1"
      >
        {manifest?.sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onSwitch={async () => {
              // WR-03: await switchSession before closing so the dialog does not
              // close before session data is loaded, and errors are not silently
              // discarded by fire-and-forget void.
              try {
                await switchSession(session.id);
                dialogRef.current?.close();
              } catch (err) {
                console.error('[SessionSwitcherModal] switchSession failed:', err);
              }
            }}
            onRename={(name) => {
              // WR-07: catch rejection so silent no-op renames surface in console
              renameSession(session.id, name).catch((err) => {
                console.error('[SessionSwitcherModal] renameSession failed:', err);
              });
            }}
            onDuplicate={() => {
              // WR-07: catch rejection so failed duplicate is not silently discarded
              duplicateSession(session.id).catch((err) => {
                console.error('[SessionSwitcherModal] duplicateSession failed:', err);
              });
            }}
            onDelete={() => {
              setPendingDelete(session);
              deleteDialogRef.current?.showModal();
            }}
          />
        ))}
      </ul>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleNewSession}
          className="w-full text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          New session
        </button>
      </div>

      {/* DeleteSessionConfirmDialog nested inside modal */}
      {/* WR-04: pass focusRestoreId so the dialog restores focus to the specific
          delete button that opened it (not the parent session-switcher trigger). */}
      <DeleteSessionConfirmDialog
        dialogRef={deleteDialogRef}
        sessionId={pendingDelete?.id ?? ''}
        sessionName={pendingDelete?.name ?? ''}
        onDeleted={() => dialogRef.current?.close()}
        focusRestoreId={pendingDelete ? `delete-session-${pendingDelete.id}` : undefined}
      />
      </div>
    </dialog>
  );
}
