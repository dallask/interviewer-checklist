import { useEffect } from 'react';
import { useAppStore } from '../store/app.js';

/**
 * Document-level keyboard shortcut hook (POLISH-03).
 *
 * Shortcuts:
 * - `/`   focuses the sidebar search input
 * - `\`   toggles sidebar open/closed
 * - `Esc` clears the search query
 *
 * All shortcuts are suppressed when the active element is an INPUT, TEXTAREA,
 * or contenteditable element, OR when a native `<dialog open>` modal is on
 * the page (except for `Esc`, which the browser already routes to the dialog).
 *
 * State reads use `useAppStore.getState()` at event time to avoid stale
 * closures (per RESEARCH.md Pitfall 2), so the effect attaches once on mount
 * with an empty dependency array.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Guard 0 (CR-04): never react to chorded shortcuts. Ctrl+/, Cmd+/,
      // Ctrl+\, Cmd+\, Alt+Esc, etc. belong to the browser/OS — calling
      // preventDefault() on them would clobber DevTools, accessibility
      // zoom, and many app-level "show shortcuts" bindings.
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Guard 1: suppress all shortcuts when focus is in an editable element.
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) {
        return;
      }

      // Guard 2: suppress non-Escape keys when a modal dialog is open.
      const openDialog = document.querySelector('dialog[open]');
      if (openDialog && e.key !== 'Escape') {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const input = document.querySelector(
          '[aria-label="Search questions"]',
        ) as HTMLInputElement | null;
        input?.focus();
      } else if (e.key === '\\') {
        e.preventDefault();
        const store = useAppStore.getState();
        store.setSidebarOpen(!store.sidebarOpen);
      } else if (e.key === 'Escape') {
        useAppStore.getState().setSearchQuery('');
        // Native <dialog> Escape handling already closes modals — no extra action.
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
