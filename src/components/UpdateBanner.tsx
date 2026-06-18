import { useEffect, useRef, useState } from 'react';

/**
 * UpdateBanner (POLISH-07).
 *
 * Sticky amber banner shown when `lastSeenVersion` !== current manifest
 * version AND `dismissedUpdateVersion` !== current version. Both keys live
 * in `chrome.storage.local` and are written by background/index.ts
 * (lastSeenVersion) and this component's dismiss button
 * (dismissedUpdateVersion).
 *
 * CRITICAL — stale-closure fix: version comparison MUST use a local const
 * captured BEFORE the `chrome.storage.local.get` callback fires, NOT the
 * React `currentVersion` state value. setState is asynchronous, so the
 * state slot is still `''` at callback time. The same local const is
 * stashed in a ref so `handleDismiss` (defined outside useEffect) can read
 * it without calling `getManifest()` a second time.
 */
export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const versionRef = useRef('');

  useEffect(() => {
    // Synchronous, local const — closes over the value used in the callback
    // below AND stashed in versionRef for handleDismiss.
    const version = chrome.runtime.getManifest().version;
    versionRef.current = version;
    setCurrentVersion(version);

    chrome.storage.local.get(
      ['lastSeenVersion', 'dismissedUpdateVersion'],
      (result) => {
        if (chrome.runtime.lastError) return;
        const lastSeen = result.lastSeenVersion as string | undefined;
        const dismissed = result.dismissedUpdateVersion as string | undefined;
        // Compare against the LOCAL CONST `version`, not the (still '')
        // React state `currentVersion`.
        if (
          lastSeen &&
          lastSeen !== version &&
          dismissed !== version
        ) {
          setShowBanner(true);
        }
      },
    );
  }, []);

  function handleDismiss() {
    const version = versionRef.current;
    chrome.storage.local.set({ dismissedUpdateVersion: version });
    setShowBanner(false);
  }

  function handleWhatsNew() {
    // Decoupled link to SidebarFooter via DOM CustomEvent — avoids prop
    // plumbing across the App tree.
    window.dispatchEvent(new CustomEvent('open-changelog'));
  }

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sticky top-0 z-30 flex items-center justify-between bg-amber-50 dark:bg-yellow-900/30 border-b border-amber-300 dark:border-yellow-700 text-amber-800 dark:text-yellow-200 px-4 py-2 text-base font-normal print:hidden"
    >
      <span>
        Updated to v{currentVersion}.{' '}
        <button
          type="button"
          onClick={handleWhatsNew}
          className="ml-1 underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          What's new
        </button>
      </span>
      <button
        type="button"
        aria-label="Dismiss update banner"
        onClick={handleDismiss}
        className="text-amber-700 dark:text-yellow-300 hover:text-amber-900 dark:hover:text-yellow-100 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0 ml-3"
      >
        ×
      </button>
    </div>
  );
}
