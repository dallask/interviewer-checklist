import './styles.css';
import { useMemo } from 'react';
import { ContentTree } from '../components/ContentTree.js';
import { MigrationErrorBanner } from '../components/MigrationErrorBanner.js';
import { Sidebar } from '../components/Sidebar.js';
import { StorageToast } from '../components/StorageToast.js';
import { UndoToast } from '../components/UndoToast.js';
import { UpdateBanner } from '../components/UpdateBanner.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { usePrintExpansion } from '../hooks/usePrintExpansion.js';
import { useAppStore } from '../store/app.js';
import { buildFlatRows } from '../utils/buildFlatRows.js';

export function App() {
  // Phase 9 polish hooks — both attach document/window listeners on mount
  // and clean them up on unmount. Empty dependency arrays inside (state is
  // read via useAppStore.getState() at event time).
  useKeyboardShortcuts();
  usePrintExpansion();

  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const topicOpen = useAppStore((s) => s.topicOpen);
  const sectionOpen = useAppStore((s) => s.sectionOpen);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedDifficulties = useAppStore((s) => s.selectedDifficulties);
  const selectedSections = useAppStore((s) => s.selectedSections);
  const scores = useAppStore((s) => s.scores);
  const hideMarked = useAppStore((s) => s.hideMarked);
  const customQuestions = useAppStore((s) => s.customQuestions);
  const migrationFailedCount = useAppStore((s) => s.migrationFailedCount);
  const migrationFailedIds = useAppStore((s) => s.migrationFailedIds);
  const sections = useAppStore((s) => s.sections);

  // Compute set of topic IDs that have at least one scored question.
  // A topic is "marked" when it has a score != null — used by hideMarked toggle.
  // Phase 11: score keys use V4 format '${topicId}-q${idx}' (D-04 stable ID format).
  // Phase 14: iterate state.sections (from store) instead of DEFAULT_SECTIONS.
  const markedTopicIds = useMemo(() => {
    const marked = new Set<string>();
    for (const section of sections) {
      for (const topic of section.topics) {
        const hasScore = topic.questions.some((_, i) => {
          const key = `${topic.id}-q${i}`;
          return scores[key] !== null && scores[key] !== undefined;
        });
        if (hasScore) marked.add(topic.id);
      }
    }
    return marked;
  }, [scores, sections]);

  // buildFlatRows now accepts V4Section[] — no cast needed (Plan 02)
  const rows = buildFlatRows(sections, topicOpen, sectionOpen, {
    searchQuery,
    selectedDifficulties,
    selectedSections,
    hideMarked,
    markedTopicIds,
    customQuestions,
  });

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
        {/* Backdrop — narrow viewports only */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 print:hidden"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Migration error banner — sticky at top of the right column, above UpdateBanner. Phase 11 D-06. */}
          <MigrationErrorBanner
            failedCount={migrationFailedCount}
            sessionIds={migrationFailedIds}
            onDismiss={() => useAppStore.getState().clearMigrationError()}
          />
          {/* Update banner — sticky at top of the right column, above main. */}
          <UpdateBanner />
          {/* Sidebar toggle button */}
          <button
            type="button"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="self-start m-2 p-2 min-h-[44px] text-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded print:hidden"
          >
            ☰
          </button>
          <main
            id="main-content"
            className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
          >
            <ContentTree rows={rows} />
          </main>
        </div>
      </div>
      <StorageToast />
      <UndoToast />
    </>
  );
}
