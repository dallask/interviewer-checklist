import './styles.css';

/**
 * Welcome page rendered as a standalone Vite entry point (welcome.html).
 *
 * Opens on first install via background/index.ts onInstalled handler.
 * Marks itself as seen only when the user clicks a CTA (WR-03 fix), so a
 * user who closes the tab mid-install still gets the page re-offered on
 * the next install event.
 *
 * Per UI-SPEC section 1: page title, subtitle, version, pin-to-toolbar
 * section, two audience cards, and primary + secondary CTA buttons.
 */
export function Welcome() {
  const { version } = chrome.runtime.getManifest();

  function handleOpenExtension() {
    // WR-03: mark hasSeenWelcome only on real CTA interaction — closing
    // the tab without clicking does not count as "seen".
    chrome.storage.local
      .set({ hasSeenWelcome: true })
      .catch((err) =>
        console.error('[interviewer-checklist] hasSeenWelcome set failed:', err),
      );
    const url = chrome.runtime.getURL('src/app/app.html');
    chrome.tabs.create({ url });
  }

  function handleViewDemo() {
    // WR-04: chrome.storage.local.set returns a Promise in MV3 — attach
    // .catch() so rejections (quota, IO) surface instead of becoming
    // unhandled-rejection noise.
    chrome.storage.local
      .set({ activeSessionOverride: 'demo' })
      .catch((err) =>
        console.error(
          '[interviewer-checklist] activeSessionOverride set failed:',
          err,
        ),
      );
    chrome.storage.local
      .set({ hasSeenWelcome: true })
      .catch((err) =>
        console.error('[interviewer-checklist] hasSeenWelcome set failed:', err),
      );
    const url = chrome.runtime.getURL('src/app/app.html');
    chrome.tabs.create({ url });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Interviewer Checklist
        </h1>
        <p className="text-base font-normal text-gray-600 dark:text-gray-400 mb-8">
          A structured interview scoring tool — browser-based, private, no
          account needed.
        </p>
        <p className="text-xs font-normal text-gray-400 dark:text-gray-500 mb-8">
          v{version}
        </p>

        <section aria-labelledby="pin-heading" className="mb-8">
          <h2
            id="pin-heading"
            className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100"
          >
            Pin to your toolbar
          </h2>
          <p className="text-base font-normal text-gray-600 dark:text-gray-400">
            Click the puzzle-piece icon in Chrome's toolbar, find Interviewer
            Checklist, then click the pin icon.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <section
            aria-labelledby="for-interviewers"
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2
              id="for-interviewers"
              className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100"
            >
              For interviewers
            </h2>
            <p className="text-base font-normal text-gray-600 dark:text-gray-400">
              Run structured technical interviews. Score questions 0–10 with
              difficulty weighting, capture notes, and generate an AI feedback
              prompt.
            </p>
          </section>
          <section
            aria-labelledby="for-candidates"
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2
              id="for-candidates"
              className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100"
            >
              For candidates
            </h2>
            <p className="text-base font-normal text-gray-600 dark:text-gray-400">
              Follow along during your interview. See which areas are being
              assessed and review the scoring rubric afterward.
            </p>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <button
            type="button"
            onClick={handleOpenExtension}
            className="bg-blue-600 text-white text-base font-semibold px-6 py-4 rounded hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[44px]"
          >
            Open the extension
          </button>
          <button
            type="button"
            onClick={handleViewDemo}
            className="text-blue-600 dark:text-blue-400 text-base font-normal underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[44px] self-center"
          >
            View demo session
          </button>
        </div>
      </main>
    </div>
  );
}
