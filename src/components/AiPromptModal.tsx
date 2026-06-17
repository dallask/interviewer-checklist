import { type RefObject, useEffect, useRef, useState } from 'react';

// AiPromptModal is purely prop-driven — it does NOT import useAppStore.
// The caller (ActionsGroup) owns the store interaction and prompt generation.

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  prompt: string;
  onClose: () => void;
}

export function AiPromptModal({ dialogRef, prompt, onClose }: Props) {
  const [editablePrompt, setEditablePrompt] = useState(prompt);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset editable content whenever the prompt prop changes (on each modal open)
  useEffect(() => {
    setEditablePrompt(prompt);
    setIsPending(false);
    setCopied(false);
    setShowFallback(false);
  }, [prompt]);

  // Clear the copy-feedback timeout when the modal unmounts to prevent
  // setCopied calls on an unmounted component.
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Focus trap + focus restore pattern (WR-02 guard from CandidateModal.tsx)
  // Focus restore target: 'open-ai-prompt' button in ActionsGroup
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
      document.getElementById('open-ai-prompt')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  const handleCopy = async () => {
    // WR-01: guard against double-submit (T-08-04)
    if (isPending) return;
    setIsPending(true);
    try {
      await navigator.clipboard.writeText(editablePrompt);
      setCopied(true);
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — select all text as fallback
      textareaRef.current?.select();
      setShowFallback(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    // T-05-03-04: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="ai-prompt-title"
      className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2
        id="ai-prompt-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        AI feedback prompt
      </h2>

      <textarea
        ref={textareaRef}
        value={editablePrompt}
        onChange={(e) => setEditablePrompt(e.target.value)}
        rows={10}
        className="w-full h-64 mt-3 mb-3 text-sm font-normal p-3 resize-y bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        aria-label="Generated AI prompt — editable"
      />

      {showFallback && (
        <p className="mb-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          Select all and copy manually
        </p>
      )}

      {copied && (
        <p aria-live="polite" className="mb-2 text-sm font-normal text-green-600 dark:text-green-400">
          Copied!
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={onClose}
          className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Close
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            void handleCopy();
          }}
          className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Copy to clipboard
        </button>
      </div>
    </dialog>
  );
}
