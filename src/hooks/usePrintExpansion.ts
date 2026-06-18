import { useEffect } from 'react';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';

/**
 * Print expansion hook (POLISH-05).
 *
 * CRITICAL: The content tree uses `@tanstack/react-virtual`, which never
 * renders collapsed topics to the DOM. A CSS-only `print:block` cannot show
 * elements that do not exist — so on `beforeprint` we must force the store
 * to expand all topics and open all sections before the browser snapshots
 * the page. After printing, we restore the pre-print state.
 *
 * State reads use `useAppStore.getState()` at event time, so the effect
 * attaches once on mount with an empty dependency array.
 *
 * User authorized this JS-hook override 2026-06-17 (per 09-CONTEXT.md).
 */
export function usePrintExpansion(): void {
  useEffect(() => {
    let savedTopicOpen: Record<string, boolean> = {};
    let savedSectionOpen: Record<string, boolean> = {};

    function handleBeforePrint() {
      const state = useAppStore.getState();
      savedTopicOpen = { ...state.topicOpen };
      savedSectionOpen = { ...state.sectionOpen };
      // WR-02: collapse all three writes into a single setState. The
      // previous code issued three separate set() calls (expandAll +
      // sectionOpen + printMode), each of which fires the module-level
      // subscribe in store/app.ts that writes uiState/manifest/session to
      // chrome.storage — three writes per print, plus a race window where
      // the browser could snapshot the page between updates.
      const topicOpen: Record<string, boolean> = {};
      for (const section of DEFAULT_SECTIONS) {
        for (const topic of section.items) {
          topicOpen[topic.id] = true;
        }
      }
      // sectionOpen `{}` means "all sections open by default" — clearing it
      // ensures every section is visible during print. printMode flag lets
      // QuestionCard / TopicRow notes render even when their notesOpen
      // toggle is closed (the HTML `hidden` attribute cannot be overridden
      // by CSS).
      useAppStore.setState({ topicOpen, sectionOpen: {}, printMode: true });
    }

    function handleAfterPrint() {
      useAppStore.setState({
        topicOpen: savedTopicOpen,
        sectionOpen: savedSectionOpen,
        printMode: false,
      });
    }

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);
}
