import { create } from 'zustand';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { Difficulty } from '../data/bank/types.js';
import { storageAdapter } from '../storage/index.js';

// ---------------------------------------------------------------------------
// Scoring domain types (Phase 5)
// ---------------------------------------------------------------------------

/** Candidate details for the scored interview session. */
export interface CandidateDetails {
  name: string;
  email: string;
  role: string;
  date: string;
  interviewer: string;
  details: string;
}

/** A user-created question attached to a topic. */
export interface CustomQuestion {
  id: string;
  topicId: string;
  text: string;
  level: Difficulty;
}

// ---------------------------------------------------------------------------
// AppState and AppActions
// ---------------------------------------------------------------------------

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
  // --- ScoringState (Phase 5) ---
  /** Per-question scores (questionId → score | null); key: "${topicId}-${questionIndex}" */
  scores: Record<string, number | null>;
  /** Per-topic score overrides (topicId → override | null) */
  overrides: Record<string, number | null>;
  /** Per-question notes (questionId → note text) */
  notes: Record<string, string>;
  /** Per-topic notes (topicId → note text) */
  topicNotes: Record<string, string>;
  /** User-created custom questions */
  customQuestions: CustomQuestion[];
  /** Candidate details for the current session; null when not yet entered */
  candidate: CandidateDetails | null;
  /** ID of the currently active session (from manifest.activeSessionId) */
  activeSessionId: string;
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
  // --- ScoringActions (Phase 5) ---
  /** Set a question score (clamped to [0, 10]; null clears the score). T-05-01-02 */
  setScore: (questionId: string, score: number | null) => void;
  /** Set a topic score override (clamped to [0, 10]; null clears). T-05-01-03 */
  setOverride: (topicId: string, override: number | null) => void;
  /** Set a per-question note. */
  setNote: (questionId: string, note: string) => void;
  /** Set a per-topic note. */
  setTopicNote: (topicId: string, note: string) => void;
  /** Add a custom question to the list. */
  addCustomQuestion: (q: CustomQuestion) => void;
  /** Remove a custom question by id. */
  deleteCustomQuestion: (id: string) => void;
  /** Update candidate details for the current session. */
  setCandidate: (candidate: CandidateDetails | null) => void;
  /** Clear all scoring data for the current session (preserves activeSessionId and uiState). */
  resetAll: () => void;
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
  // ScoringState defaults
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
  activeSessionId: '',
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

  // ScoringActions — Phase 5

  // T-05-01-02: clamp to [0, 10] to mitigate keyboard input bypass of slider min/max
  setScore: (questionId, score) =>
    set((s) => ({
      scores: {
        ...s.scores,
        [questionId]: score !== null ? Math.min(10, Math.max(0, score)) : null,
      },
    })),

  // T-05-01-03: clamp to [0, 10] in action body; UI also enforces on blur
  setOverride: (topicId, override) =>
    set((s) => ({
      overrides: {
        ...s.overrides,
        [topicId]:
          override !== null ? Math.min(10, Math.max(0, override)) : null,
      },
    })),

  setNote: (questionId, note) =>
    set((s) => ({ notes: { ...s.notes, [questionId]: note } })),

  setTopicNote: (topicId, note) =>
    set((s) => ({ topicNotes: { ...s.topicNotes, [topicId]: note } })),

  addCustomQuestion: (q) =>
    set((s) => ({ customQuestions: [...s.customQuestions, q] })),

  deleteCustomQuestion: (id) =>
    set((s) => ({
      customQuestions: s.customQuestions.filter((cq) => cq.id !== id),
    })),

  setCandidate: (candidate) => set({ candidate }),

  resetAll: () =>
    set({
      scores: {},
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      selectedDifficulties: new Set(),
      selectedSections: new Set(),
      searchQuery: '',
      hideMarked: false,
      // activeSessionId is NOT reset — session identity must persist across resets
    }),
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

  // Session persistence: write scoring state under session:<id> key when a session is active.
  // Guard: only write when activeSessionId is non-empty to avoid orphaned session keys.
  if (state.activeSessionId) {
    storageAdapter.write({
      [`session:${state.activeSessionId}`]: {
        version: 3,
        id: state.activeSessionId,
        scores: state.scores,
        overrides: state.overrides,
        notes: state.notes,
        topicNotes: state.topicNotes,
        customQuestions: state.customQuestions,
        candidate: state.candidate,
      },
    });
  }
});
