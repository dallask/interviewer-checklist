import { useEffect, type RefObject } from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function AboutModal({ dialogRef }: AboutModalProps) {
  const { version } = chrome.runtime.getManifest();

  // Focus trap: query focusable elements inside handler each time (for dynamic state safety)
  useEffect(() => {
    const maybeDialog = dialogRef.current;
    if (!maybeDialog) return;
    // Assign to const with non-null type so TypeScript preserves narrowing in closures
    const dialogEl: HTMLDialogElement = maybeDialog;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
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
      (document.querySelector('[data-about-trigger]') as HTMLElement | null)?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) dialogRef.current?.close();
  }

  return (
    // T-05-03-04: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="about-modal-title"
      className="fixed inset-0 m-auto w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
      onClick={handleBackdropClick}
    >
      <h2
        id="about-modal-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1"
      >
        Interviewer Checklist
      </h2>
      <p className="text-xs font-normal text-gray-400 dark:text-gray-500 mb-4">
        v{version}
      </p>

      <p className="text-[13px] font-normal text-gray-700 dark:text-gray-300 mb-3">
        A Chrome extension for structured technical interviews. Score candidates across topics, manage sessions, and export results as YAML.
      </p>

      <ul className="text-[13px] font-normal text-gray-600 dark:text-gray-400 mb-4 space-y-1 list-disc list-inside">
        <li>Weighted per-topic scoring with manual override</li>
        <li>Built-in question bank across 9 tech areas (Frontend, Backend, DevOps…)</li>
        <li>Add custom sections, topics, and questions per session</li>
        <li>Difficulty filter (Novice → Expert) and full-text search</li>
        <li>Per-question notes with collapsible textarea</li>
        <li>Multiple sessions — switch, rename, duplicate, delete</li>
        <li>Export / import sessions as human-readable YAML</li>
        <li>AI prompt generator for structured feedback</li>
        <li>Dark mode, print-friendly layout</li>
      </ul>

      <div className="mb-4 text-[13px] font-normal text-gray-700 dark:text-gray-300">
        Developed by{' '}
        <a
          href="https://kivgila.pro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Ievgen Kyvgyla
        </a>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Close about modal"
          onClick={() => dialogRef.current?.close()}
          className="flex items-center gap-2 transition-colors duration-150 text-[13px] font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Close
        </button>
      </div>
    </dialog>
  );
}
