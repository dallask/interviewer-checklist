import { useAppStore } from '../store/app.js';

export function UndoToast() {
  const undoBuffer = useAppStore((s) => s.undoBuffer);
  const undoDeleteSession = useAppStore((s) => s.undoDeleteSession);
  const setUndoBuffer = useAppStore((s) => s.setUndoBuffer);

  if (!undoBuffer) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 flex items-center justify-between py-2 px-4 motion-safe:animate-[slide-up_150ms_ease-out]"
    >
      <span className="text-xs font-normal">
        &ldquo;{undoBuffer.sessionMeta.name}&rdquo; deleted
      </span>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => {
            void undoDeleteSession();
          }}
          className="text-xs font-normal text-blue-400 dark:text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ml-4 shrink-0"
        >
          Undo
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setUndoBuffer(null)}
          className="text-gray-400 hover:text-white dark:hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
