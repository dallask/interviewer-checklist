/**
 * MigrationErrorBanner (Phase 11 — D-06 skip-and-continue).
 *
 * Non-blocking amber banner shown when one or more V3→V4 migration attempts
 * failed during bootstrap. The banner displays the count of failed sessions
 * and informs the user that a pre-migration backup was written to storage.
 *
 * Renders null when failedCount === 0 so callers can always mount this component.
 * Dismiss clears the banner immediately (user-level acknowledgment only; the
 * stored snapshot keys remain in chrome.storage.local).
 */

import { X } from 'lucide-react';

interface Props {
  failedCount: number;
  sessionIds: string[];
  onDismiss: () => void;
}

export function MigrationErrorBanner({
  failedCount,
  sessionIds: _sessionIds,
  onDismiss,
}: Props) {
  if (failedCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sticky top-0 z-30 flex items-center justify-between bg-amber-50 dark:bg-yellow-900/30 border-b border-amber-300 dark:border-yellow-700 text-amber-800 dark:text-yellow-200 px-4 py-2 text-base font-normal print:hidden"
    >
      <span>
        {failedCount} session{failedCount > 1 ? 's' : ''} couldn't be upgraded —
        your other sessions are loaded. A backup is stored at{' '}
        <code>snapshot:&lt;id&gt;:pre-v4-&lt;timestamp&gt;</code>.
      </span>
      <button
        type="button"
        aria-label="Dismiss migration error"
        onClick={onDismiss}
        className="text-amber-700 dark:text-yellow-300 hover:text-amber-900 dark:hover:text-yellow-100 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0 ml-3"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
