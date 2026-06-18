import { useEffect, useState } from 'react';
import { ChangelogViewer } from './ChangelogViewer.js';

/**
 * SidebarFooter (POLISH-06).
 *
 * Renders at the bottom of the sidebar `<aside>`. Shows the app version
 * (read synchronously from `chrome.runtime.getManifest().version`) and a
 * "What's new" toggle that reveals the collapsible CHANGELOG viewer below.
 *
 * Also listens for the `open-changelog` DOM CustomEvent dispatched by
 * UpdateBanner so clicking "What's new" in the banner opens the same
 * collapsible without prop plumbing.
 */
export function SidebarFooter() {
  const { version } = chrome.runtime.getManifest();
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => {
    const handler = () => setChangelogOpen(true);
    window.addEventListener('open-changelog', handler);
    return () => window.removeEventListener('open-changelog', handler);
  }, []);

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-700 print:hidden">
      <div className="px-3 py-2 text-xs font-normal text-gray-400 dark:text-gray-500 flex items-center">
        <span>v{version}</span>
        <button
          type="button"
          onClick={() => setChangelogOpen((v) => !v)}
          aria-expanded={changelogOpen}
          className="ml-2 underline text-xs font-normal text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          What's new
        </button>
      </div>
      {changelogOpen && <ChangelogViewer />}
    </div>
  );
}
