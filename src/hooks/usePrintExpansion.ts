import { useEffect } from 'react';
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
      // expandAll() opens every topic by writing `topicOpen[id] = true` for
      // every topic in DEFAULT_SECTIONS.
      state.expandAll();
      // sectionOpen `{}` means "all sections open by default" — clearing it
      // ensures every section is visible during print.
      useAppStore.setState({ sectionOpen: {} });
      // printMode flag lets QuestionCard / TopicRow notes render even when
      // their notesOpen toggle is closed (the HTML `hidden` attribute cannot
      // be overridden by CSS).
      useAppStore.setState({ printMode: true });
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
