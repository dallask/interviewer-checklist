import { create } from 'zustand';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { Difficulty } from '../data/bank/types.js';
import { storageAdapter } from '../storage/index.js';
import type { V2Manifest, V4Section, V4Session, V4Topic } from '../storage/types.js';
import { createDefaultV4Session } from '../storage/types.js';
import type { ImportResult } from '../utils/yamlImport.js';

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
// Session management types (Phase 6)
// ---------------------------------------------------------------------------

/** In-memory undo buffer for session delete — never persisted to storage. */
export interface UndoBuffer {
  /** The session metadata entry from manifest.sessions */
  sessionMeta: V2Manifest['sessions'][number];
  /** The full session scoring payload */
  sessionData: V4Session;
  /** If true, the deleted session was the active one; restore on undo */
  wasActive: boolean;
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
  /** Whether to suppress all note areas (per-question and per-topic) — UI-only, not persisted */
  hideNotes: boolean;
  /** Dark mode enabled */
  darkMode: boolean;
  // --- ScoringState (Phase 5) ---
  /** Per-question scores (questionId → score | null); key: "${topicId}-q${questionIndex}" (V4 format, D-04) */
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
  // --- Session management (Phase 6) ---
  /** Full manifest object mirrored in store for reactive session list. */
  manifest: V2Manifest | null;
  /** In-memory undo buffer for session delete — never persisted. */
  undoBuffer: UndoBuffer | null;
  /**
   * Phase 9 (POLISH-05): true while a `beforeprint` event has fired and the
   * subsequent `afterprint` event has not yet restored state. Used by note
   * textareas to render even when their notesOpen toggle is closed, so the
   * print snapshot includes content normally hidden via the `hidden` HTML
   * attribute (which CSS cannot override).
   */
  printMode: boolean;
  // --- V4 session fields (Phase 11) ---
  /** Materialized section/topic/question tree for the active V4 session; populated at bootstrap and on switchSession */
  sections: V4Section[];
  /** IDs of default questions removed from the active session (D-01 Set-based filter model) */
  removedDefaultQuestionIds: Set<string>;
  /** Number of sessions that failed V3→V4 migration; drives MigrationErrorBanner */
  migrationFailedCount: number;
  /** IDs of sessions that failed migration; for banner display */
  migrationFailedIds: string[];
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
  clearDifficulties: () => void;
  clearSections: () => void;
  setHideMarked: (v: boolean) => void;
  setHideNotes: (v: boolean) => void;
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
  // --- Bank mutation actions (Phase 14) ---
  /** Add a new user-defined section to the active session (BANK-01). */
  addSection: (section: V4Section) => void;
  /** Remove a user-added section from the active session (BANK-02). */
  removeSection: (sectionId: string) => void;
  /** Add a new topic to a section (BANK-03). */
  addTopic: (sectionId: string, topic: V4Topic) => void;
  /** Remove a user-added topic from the active session (BANK-04). */
  removeTopic: (topicId: string) => void;
  /** Mark a default question as removed (adds to filter Set) (BANK-05). */
  removeDefaultQuestion: (questionId: string) => void;
  /** Clear all scoring data for the current session (preserves activeSessionId and uiState). */
  resetAll: () => void;
  // --- Session management actions (Phase 6) ---
  /** Create a new session, auto-named "Session N" (highest existing N + 1), and switch to it. */
  createSession: () => Promise<void>;
  /** Rename a session by id; updates updatedAt. Does not change active session. */
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  /** Duplicate a session row (reads from storage by ID, not current Zustand state). */
  duplicateSession: (sessionId: string) => Promise<void>;
  /** Delete a session; captures undo buffer BEFORE remove; auto-switches if active. */
  deleteSession: (sessionId: string) => Promise<void>;
  /** Switch to target session: flushPending() FIRST, then load data, then single setState. */
  switchSession: (targetId: string) => Promise<void>;
  /** Undo the last deleteSession: re-write session data + re-insert SessionMeta. */
  undoDeleteSession: () => Promise<void>;
  /** Simple setter for manifest (used by bootstrap hydration). */
  setManifest: (manifest: V2Manifest) => void;
  /** Simple setter for undoBuffer (used by UndoToast dismiss button). */
  setUndoBuffer: (buf: UndoBuffer | null) => void;
  // --- YAML import action (Phase 7) ---
  /** Import a parsed YAML result into the store.
   *  STORE-05: storageAdapter.snapshot() is called BEFORE any mutation.
   *  overwriteActive=false: creates a new session; overwriteActive=true: applies to active session. */
  importSession: (data: ImportResult, overwriteActive: boolean) => Promise<void>;
  /** Clear migration error state (reset migrationFailedCount and migrationFailedIds). */
  clearMigrationError: () => void;
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
  hideNotes: false,
  darkMode: false,
  // ScoringState defaults
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
  activeSessionId: '',
  // Session management defaults (Phase 6)
  manifest: null,
  undoBuffer: null,
  // Phase 9: print expansion flag — only true between beforeprint and afterprint.
  printMode: false,
  // Phase 11: V4 session fields
  sections: [],
  // Phase 14: removedDefaultQuestionIds — bank shape filter (D-01)
  removedDefaultQuestionIds: new Set<string>(),
  migrationFailedCount: 0,
  migrationFailedIds: [],
};

// ---------------------------------------------------------------------------
// Helper: compute next auto-number session name
// Finds the highest "Session N" number across existing sessions and returns
// "Session N+1". Falls back to "Session 1" when no numbered sessions exist.
// ---------------------------------------------------------------------------
function nextSessionName(sessions: V2Manifest['sessions']): string {
  const numbers = sessions
    .map((s) => {
      const match = /^Session (\d+)$/.exec(s.name);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `Session ${max + 1}`;
}

// CR-02/WR-05: module-level timer handle — prevents leaked undo timers on
// rapid double-delete and enables cancellation when undo is triggered manually.
let undoTimer: ReturnType<typeof setTimeout> | null = null;

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

  clearDifficulties: () => set({ selectedDifficulties: new Set() }),
  clearSections: () => set({ selectedSections: new Set() }),

  setHideMarked: (v) => set({ hideMarked: v }),

  setHideNotes: (v) => set({ hideNotes: v }),

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

  // ---------------------------------------------------------------------------
  // Session management actions — Phase 6
  // ---------------------------------------------------------------------------

  setManifest: (manifest) => set({ manifest }),

  setUndoBuffer: (buf) => set({ undoBuffer: buf }),

  // SESS-04: switchSession must call flushPending() BEFORE any set() to prevent
  // cross-session write corruption. The subscribe callback writes data under
  // `session:${activeSessionId}`, so activeSessionId must NOT change before flush.
  switchSession: async (targetId) => {
    // Step 1: flush any pending writes for the CURRENT session FIRST (SESS-04)
    storageAdapter.flushPending();

    // Step 2: read target session data from chrome.storage.local
    const key = `session:${targetId}`;
    const raw = await storageAdapter.read([key]);
    const session = raw[key] as V4Session | undefined;

    // Step 3: atomically update store — all per-session fields + activeSessionId
    // + manifest.activeSessionId in ONE set() call.
    // Pitfall 2 guard: never split this into multiple set() calls.
    // Filter fields are reset so the new session's questions are fully visible
    // regardless of what filters were active in the previous session.
    set((s) => ({
      manifest: s.manifest
        ? { ...s.manifest, activeSessionId: targetId }
        : s.manifest,
      sections: session?.sections ?? [],
      scores: session?.scores ?? {},
      overrides: session?.overrides ?? {},
      notes: session?.notes ?? {},
      topicNotes: session?.topicNotes ?? {},
      customQuestions: session?.customQuestions ?? [],
      candidate: session?.candidate ?? null,
      activeSessionId: targetId,
      // Reset UI filters on session switch so stale filter state from a
      // previous session cannot hide questions in the newly loaded session.
      selectedDifficulties: new Set(),
      selectedSections: new Set(),
      searchQuery: '',
      hideMarked: false,
    }));
  },

  createSession: async () => {
    const state = useAppStore.getState();
    const sessions = state.manifest?.sessions ?? [];
    const name = nextSessionName(sessions);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Write new session data to storage
    const newSession = createDefaultV4Session(id);
    storageAdapter.write({ [`session:${id}`]: newSession });

    // Update manifest in store: append new SessionMeta
    const newMeta: V2Manifest['sessions'][number] = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
    };
    const updatedManifest: V2Manifest = state.manifest
      ? { ...state.manifest, activeSessionId: id, sessions: [...state.manifest.sessions, newMeta] }
      : {
          version: 2,
          activeSessionId: id,
          sessions: [newMeta],
        };
    set({ manifest: updatedManifest });

    // Switch to the new session (flushPending() fires inside switchSession — SESS-04)
    await useAppStore.getState().switchSession(id);
  },

  renameSession: async (sessionId, newName) => {
    const state = useAppStore.getState();
    if (!state.manifest) return;
    const now = new Date().toISOString();
    const updatedSessions = state.manifest.sessions.map((s) =>
      s.id === sessionId ? { ...s, name: newName, updatedAt: now } : s,
    );
    set({
      manifest: { ...state.manifest, sessions: updatedSessions },
    });
  },

  duplicateSession: async (sessionId) => {
    const state = useAppStore.getState();
    if (!state.manifest) return;

    // Read from storage by sessionId — NOT from current Zustand state (A3 guard)
    const raw = await storageAdapter.read([`session:${sessionId}`]);
    const source = raw[`session:${sessionId}`] as V4Session | undefined;

    const originalMeta = state.manifest.sessions.find((s) => s.id === sessionId);
    if (!originalMeta || !source) return;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const copyName = `${originalMeta.name} (copy)`;

    // Write new session data (copy) to storage
    const copySession: V4Session = { ...source, id: newId };
    storageAdapter.write({ [`session:${newId}`]: copySession });

    // Append new SessionMeta to manifest — does NOT change activeSessionId
    const newMeta: V2Manifest['sessions'][number] = {
      id: newId,
      name: copyName,
      createdAt: now,
      updatedAt: now,
    };
    set({
      manifest: {
        ...state.manifest,
        sessions: [...state.manifest.sessions, newMeta],
      },
    });
  },

  deleteSession: async (sessionId) => {
    const state = useAppStore.getState();
    if (!state.manifest) return;

    const meta = state.manifest.sessions.find((s) => s.id === sessionId);
    const wasActive = sessionId === state.activeSessionId;

    // Step 1: read session data from storage BEFORE deletion — Pitfall "Async deleteSession" guard
    const raw = await storageAdapter.read([`session:${sessionId}`]);
    const data = raw[`session:${sessionId}`] as V4Session | undefined;

    // Step 2: capture undo buffer BEFORE remove (T-06-01-02 mitigated)
    if (meta && data) {
      set({ undoBuffer: { sessionMeta: meta, sessionData: data, wasActive } });
    }

    // Step 3: commit deletion to storage via the adapter so the pending-write
    // buffer is flushed first and the abstraction boundary is never violated
    // (CR-01: storageAdapter.remove() awaits flush before remove so the set()
    // and remove() never race — previous fire-and-forget flushPending() + direct
    // chrome.storage.local.remove could let the set() re-write the deleted key).
    await storageAdapter.remove(`session:${sessionId}`);

    // Step 4: update manifest — remove deleted session entry
    const remainingSessions = state.manifest.sessions.filter(
      (s) => s.id !== sessionId,
    );
    const updatedManifest: V2Manifest = {
      ...state.manifest,
      sessions: remainingSessions,
    };
    set({ manifest: updatedManifest });

    // Step 5: auto-switch if the deleted session was active
    if (wasActive) {
      if (remainingSessions.length > 0) {
        // Switch to the most-recently-updated remaining session
        const sorted = [...remainingSessions].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        const nextId = sorted[0].id;
        await useAppStore.getState().switchSession(nextId);
      } else {
        // No sessions remain — create a blank "Session 1" and switch to it
        await useAppStore.getState().createSession();
      }
    }

    // Step 6: start undo timer — auto-clear undoBuffer after 10 seconds.
    // CR-02/WR-05: cancel any pre-existing timer before starting a new one so
    // a rapid double-delete does not clear the second undo buffer prematurely.
    if (undoTimer !== null) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      set({ undoBuffer: null });
      undoTimer = null;
    }, 10_000);
  },

  undoDeleteSession: async () => {
    const state = useAppStore.getState();
    const buf = state.undoBuffer;
    if (!buf || !state.manifest) return;

    // CR-02/WR-05: cancel the auto-clear timer since the user acted manually.
    if (undoTimer !== null) {
      clearTimeout(undoTimer);
      undoTimer = null;
    }

    // Re-write session data to storage
    storageAdapter.write({
      [`session:${buf.sessionMeta.id}`]: buf.sessionData,
    });

    // Re-insert SessionMeta back into manifest.sessions
    set((s) => ({
      manifest: s.manifest
        ? {
            ...s.manifest,
            sessions: [...s.manifest.sessions, buf.sessionMeta],
          }
        : s.manifest,
      undoBuffer: null,
    }));

    // If the deleted session was the active one, switch back to it
    if (buf.wasActive) {
      await useAppStore.getState().switchSession(buf.sessionMeta.id);
    }
  },

  clearMigrationError: () => set({ migrationFailedCount: 0, migrationFailedIds: [] }),

  // ---------------------------------------------------------------------------
  // importSession — Phase 7 (YAML-02 / YAML-03)
  // STORE-05: snapshot MUST be the first await before any mutation.
  // T-07-05: verified by call-order test in app.test.ts.
  // ---------------------------------------------------------------------------
  importSession: async (data: ImportResult, overwriteActive: boolean) => {
    const { activeSessionId } = useAppStore.getState();

    // CR-01: flush any debounced writes so snapshot() reads the latest data.
    // snapshot() reads from chrome.storage.local directly and does not consult
    // the in-memory pending write buffer; without this flush, changes made in
    // the final debounce window (300 ms) before clicking Confirm would be lost
    // from the rollback snapshot. flushPendingAsync() awaits the internal
    // #flush() so chrome.storage.local.set() is complete before snapshot().
    await storageAdapter.flushPendingAsync();

    // STORE-05: snapshot MUST be called first — before any set() or createSession()
    await storageAdapter.snapshot(activeSessionId);

    // CR-01: clamp imported scores/overrides to [0, 10] — importSession bypasses
    // setScore/setOverride which normally enforce clamping. Null values pass through.
    function clampScore(v: number | null): number | null {
      return v !== null ? Math.min(10, Math.max(0, v)) : null;
    }
    const clampedScores = Object.fromEntries(
      Object.entries(data.scores).map(([k, v]) => [k, clampScore(v)]),
    );
    const clampedOverrides = Object.fromEntries(
      Object.entries(data.overrides).map(([k, v]) => [k, clampScore(v)]),
    );

    if (overwriteActive) {
      // Apply scores/notes/candidate directly to the active session.
      // Reset filters so the imported data is fully visible — stale filters
      // (e.g. 'advanced' selected) would silently hide imported questions.
      set({
        scores: clampedScores,
        overrides: clampedOverrides,
        notes: data.notes,
        topicNotes: data.topicNotes,
        customQuestions: data.customQuestions,
        candidate: data.candidate,
        selectedDifficulties: new Set(),
        selectedSections: new Set(),
        searchQuery: '',
        hideMarked: false,
      });
    } else {
      // Create a new session and rename it to data.sessionName if provided
      await useAppStore.getState().createSession();
      const newId = useAppStore.getState().activeSessionId;
      if (data.sessionName) {
        await useAppStore.getState().renameSession(newId, data.sessionName);
      }
      // Apply import data to the new session.
      // Reset filters here too — createSession calls switchSession which now
      // clears filters, but the explicit reset ensures correctness regardless
      // of future changes to switchSession behaviour.
      set({
        scores: clampedScores,
        overrides: clampedOverrides,
        notes: data.notes,
        topicNotes: data.topicNotes,
        customQuestions: data.customQuestions,
        candidate: data.candidate,
        selectedDifficulties: new Set(),
        selectedSections: new Set(),
        searchQuery: '',
        hideMarked: false,
      });
    }
  },
}));

// ---------------------------------------------------------------------------
// PersistedUIState: compile-time contract for what is written to storage.
// Excludes transient-only fields so TypeScript will error if a developer
// accidentally adds hideNotes, printMode, or session-domain fields to the
// subscribe write block or reads them back in main.tsx. The `satisfies`
// operator on the uiState object literal below enforces this at the write
// site; Partial<PersistedUIState> at the read site (main.tsx) does the same.
// ---------------------------------------------------------------------------
export type PersistedUIState = {
  sidebarOpen: boolean;
  sectionOpen: Record<string, boolean>;
  groupOpen: Record<string, boolean>;
  topicOpen: Record<string, boolean>;
  searchQuery: string;
  selectedDifficulties: Difficulty[];
  selectedSections: string[];
  hideMarked: boolean;
  darkMode: boolean;
};

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
      // hideNotes intentionally excluded: it is UI-only and must not be persisted.
      // PersistedUIState (above) makes this exclusion a compile-time guarantee —
      // adding hideNotes here will produce a TypeScript excess-property error.
    } satisfies PersistedUIState,
  });

  // Phase 6: persist manifest when it is set (Pitfall 6 guard — manifest not written after session ops)
  if (state.manifest) {
    storageAdapter.write({ manifest: state.manifest });
  }

  // Session persistence: write scoring state under session:<id> key when a session is active.
  // Guard: only write when activeSessionId is non-empty to avoid orphaned session keys.
  // Phase 11: writes version:4 with sections field (V4Session shape).
  if (state.activeSessionId) {
    storageAdapter.write({
      [`session:${state.activeSessionId}`]: {
        version: 4,
        id: state.activeSessionId,
        sections: state.sections,
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
