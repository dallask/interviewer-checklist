import { Info } from 'lucide-react';
import { useRef } from 'react';
import { AboutModal } from './AboutModal.js';

export function SidebarFooter() {
  const aboutDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-700 print:hidden">
      <div className="px-3 py-2 text-xs font-normal text-gray-100 dark:text-gray-100 flex items-center justify-center gap-1.5 flex-wrap">
        <span>Developed by</span>
        <a
          href="https://kivgila.pro"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white dark:hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Ievgen Kyvgyla
        </a>
        <button
          type="button"
          data-about-trigger
          onClick={() => aboutDialogRef.current?.showModal()}
          title="About"
          aria-label="About this app"
          className="p-0.5 text-gray-100 dark:text-gray-100 hover:text-white dark:hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
      <AboutModal dialogRef={aboutDialogRef} />
    </div>
  );
}
