import { useEffect, useRef, useState } from 'react';
import { AboutModal } from './AboutModal.js';
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
  const aboutDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handler = () => setChangelogOpen(true);
    window.addEventListener('open-changelog', handler);
    return () => window.removeEventListener('open-changelog', handler);
  }, []);

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-700 print:hidden">
      <div className="px-3 pt-2 pb-0 text-xs font-normal text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-wrap">
        <span>Developed by </span>
        <a
          href="https://kivgila.pro"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Ievgen Kyvgyla
        </a>
        <button
          type="button"
          data-about-trigger
          onClick={() => aboutDialogRef.current?.showModal()}
          className="ml-1 underline text-xs font-normal text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          About
        </button>
      </div>
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
      <AboutModal dialogRef={aboutDialogRef} />
    </div>
  );
}
