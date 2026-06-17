import { create } from 'zustand';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { Difficulty } from '../data/bank/types.js';
import { storageAdapter } from '../storage/index.js';

export interface AppState {
  /** Sidebar visibility */
  sidebarOpen: boolean;
  /** Per-section collapse state in content tree (sectionId → collapsed) */
  sectionOpen: Record<string, boolean>;
  /** Per-group collapse state in sidebar (groupId → open) */
  groupOpen: Record<string, boolean>;
  /** Per-topic collapse state in content tree (topicId → open) */
  topicOpen: Record<string, boolean>;
  /** Current search query string */
  searchQuery: string;
  /** Active difficulty filter — empty Set means all difficulties shown */
  selectedDifficulties: Set<Difficulty>;
  /** Active section filter — empty Set means all sections shown */
  selectedSections: Set<string>;
  /** Whether to hide topics with all questions already marked */
  hideMarked: boolean;
  /** Dark mode enabled */
  darkMode: boolean;
}

export interface AppActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSectionOpen: (sectionId: string) => void;
  toggleGroup: (groupId: string) => void;
  toggleTopic: (topicId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchQuery: (q: string) => void;
  toggleDifficulty: (d: Difficulty) => void;
  toggleSection: (id: string) => void;
  setHideMarked: (v: boolean) => void;
  setDarkMode: (dark: boolean) => void;
}

export const DEFAULT_STATE: AppState = {
  sidebarOpen: true,
  sectionOpen: {},
  groupOpen: { search: true, difficulty: true, sections: true, actions: true },
  topicOpen: {},
  searchQuery: '',
  selectedDifficulties: new Set<Difficulty>(),
  selectedSections: new Set<string>(),
  hideMarked: false,
  darkMode: false,
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...DEFAULT_STATE,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSectionOpen: (sectionId) =>
    set((s) => ({
      sectionOpen: {
        ...s.sectionOpen,
        [sectionId]: !s.sectionOpen[sectionId],
      },
    })),

  toggleGroup: (groupId) =>
    set((s) => ({
      groupOpen: { ...s.groupOpen, [groupId]: !s.groupOpen[groupId] },
    })),

  toggleTopic: (topicId) =>
    set((s) => ({
      topicOpen: {
        ...s.topicOpen,
        // undefined means open (default). Toggle: undefined → false, false → true, true → false
        [topicId]: !s.topicOpen[topicId],
      },
    })),

  expandAll: () => {
    const topicOpen: Record<string, boolean> = {};
    for (const section of DEFAULT_SECTIONS) {
      for (const topic of section.items) {
        topicOpen[topic.id] = true;
      }
    }
    set({ topicOpen });
  },

  collapseAll: () => {
    const topicOpen: Record<string, boolean> = {};
    for (const section of DEFAULT_SECTIONS) {
      for (const topic of section.items) {
        topicOpen[topic.id] = false;
      }
    }
    set({ topicOpen });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleDifficulty: (d) =>
    set((s) => {
      const next = new Set(s.selectedDifficulties);
      if (next.has(d)) {
        next.delete(d);
      } else {
        next.add(d);
      }
      return { selectedDifficulties: next };
    }),

  toggleSection: (id) =>
    set((s) => {
      const next = new Set(s.selectedSections);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedSections: next };
    }),

  setHideMarked: (v) => set({ hideMarked: v }),

  setDarkMode: (dark) => {
    // Sync DOM immediately — T-04-01-01 mitigated by boolean type enforcement
    document.documentElement.classList.toggle('dark', dark);
    set({ darkMode: dark });
  },
}));

// Module-level subscribe: fires after every mutation.
// Serializes Sets → Arrays before write (T-04-01-02 mitigation: JSON cannot serialize Set).
// Per RESEARCH.md Anti-Patterns: subscribe belongs at module level, not inside components.
useAppStore.subscribe((state) => {
  storageAdapter.write({
    uiState: {
      sidebarOpen: state.sidebarOpen,
      sectionOpen: state.sectionOpen,
      groupOpen: state.groupOpen,
      topicOpen: state.topicOpen,
      searchQuery: state.searchQuery,
      selectedDifficulties: [...state.selectedDifficulties],
      selectedSections: [...state.selectedSections],
      hideMarked: state.hideMarked,
      darkMode: state.darkMode,
    },
  });
});
