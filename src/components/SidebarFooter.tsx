import { useRef } from 'react';
import { AboutModal } from './AboutModal.js';

export function SidebarFooter() {
  const aboutDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-700 print:hidden">
      <div className="px-3 py-2 text-xs font-normal text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1.5 flex-wrap">
        <span>Developed by</span>
        <a
          href="https://kivgila.pro"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-500 dark:hover:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Ievgen Kyvgyla
        </a>
        <button
          type="button"
          data-about-trigger
          onClick={() => aboutDialogRef.current?.showModal()}
          title="About"
          aria-label="About this app"
          className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          ℹ️
        </button>
      </div>
      <AboutModal dialogRef={aboutDialogRef} />
    </div>
  );
}
