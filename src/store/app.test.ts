import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STATE, useAppStore } from './app.js';

// Mock storageAdapter at the module level to prevent actual storage writes in tests
vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    write: vi.fn(),
    read: vi.fn(),
    flushPending: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
    snapshot: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mock is set up
const { storageAdapter } = await import('../storage/index.js');

describe('useAppStore — initial state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(DEFAULT_STATE);
  });

  it('sidebarOpen defaults to true', () => {
    const state = useAppStore.getState();
    expect(state.sidebarOpen).toBe(true);
  });

  it('groupOpen keys search/difficulty/sections/actions all default to true', () => {
    const { groupOpen } = useAppStore.getState();
    expect(groupOpen.search).toBe(true);
    expect(groupOpen.difficulty).toBe(true);
    expect(groupOpen.sections).toBe(true);
    expect(groupOpen.actions).toBe(true);
  });

  it('topicOpen is empty Record', () => {
    const { topicOpen } = useAppStore.getState();
    expect(topicOpen).toEqual({});
  });

  it('searchQuery is empty string', () => {
    expect(useAppStore.getState().searchQuery).toBe('');
  });

  it('selectedDifficulties is empty Set', () => {
    const { selectedDifficulties } = useAppStore.getState();
    expect(selectedDifficulties).toBeInstanceOf(Set);
    expect(selectedDifficulties.size).toBe(0);
  });

  it('selectedSections is empty Set', () => {
    const { selectedSections } = useAppStore.getState();
    expect(selectedSections).toBeInstanceOf(Set);
    expect(selectedSections.size).toBe(0);
  });

  it('hideMarked defaults to false', () => {
    expect(useAppStore.getState().hideMarked).toBe(false);
  });

  it('darkMode defaults to false', () => {
    expect(useAppStore.getState().darkMode).toBe(false);
  });

  it('sectionOpen is empty Record', () => {
    const { sectionOpen } = useAppStore.getState();
    expect(sectionOpen).toEqual({});
  });
});

describe('useAppStore — actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(DEFAULT_STATE);
  });

  it('setSidebarOpen(false) sets sidebarOpen to false', () => {
    useAppStore.getState().setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('toggleGroup("search") flips groupOpen.search from true to false', () => {
    useAppStore.getState().toggleGroup('search');
    expect(useAppStore.getState().groupOpen.search).toBe(false);
  });

  it('toggleGroup("search") called again flips groupOpen.search back to true', () => {
    useAppStore.getState().toggleGroup('search');
    useAppStore.getState().toggleGroup('search');
    expect(useAppStore.getState().groupOpen.search).toBe(true);
  });

  it('toggleTopic("t1") sets topicOpen["t1"] to true (undefined → !undefined = true)', () => {
    useAppStore.getState().toggleTopic('t1');
    // !undefined = true (JS coercion). First explicit toggle stores true (explicit open state).
    // Second toggle would set to false (collapsed). isOpen = topicOpen[id] !== false.
    expect(useAppStore.getState().topicOpen.t1).toBe(true);
  });

  it('expandAll() sets all topic IDs to true in topicOpen', () => {
    useAppStore.getState().expandAll();
    const { topicOpen } = useAppStore.getState();
    expect(Object.keys(topicOpen).length).toBeGreaterThan(0);
    for (const key of Object.keys(topicOpen)) {
      expect(topicOpen[key]).toBe(true);
    }
  });

  it('collapseAll() sets all topic IDs to false in topicOpen', () => {
    useAppStore.getState().collapseAll();
    const { topicOpen } = useAppStore.getState();
    expect(Object.keys(topicOpen).length).toBeGreaterThan(0);
    for (const key of Object.keys(topicOpen)) {
      expect(topicOpen[key]).toBe(false);
    }
  });

  it('setSearchQuery("react") sets searchQuery to "react"', () => {
    useAppStore.getState().setSearchQuery('react');
    expect(useAppStore.getState().searchQuery).toBe('react');
  });

  it('toggleDifficulty("novice") adds novice to selectedDifficulties', () => {
    useAppStore.getState().toggleDifficulty('novice');
    expect(useAppStore.getState().selectedDifficulties.has('novice')).toBe(
      true,
    );
  });

  it('toggleDifficulty("novice") called again removes novice from selectedDifficulties', () => {
    useAppStore.getState().toggleDifficulty('novice');
    useAppStore.getState().toggleDifficulty('novice');
    expect(useAppStore.getState().selectedDifficulties.has('novice')).toBe(
      false,
    );
  });

  it('toggleSection("js") adds "js" to selectedSections Set', () => {
    useAppStore.getState().toggleSection('js');
    expect(useAppStore.getState().selectedSections.has('js')).toBe(true);
  });

  it('setHideMarked(true) sets hideMarked to true', () => {
    useAppStore.getState().setHideMarked(true);
    expect(useAppStore.getState().hideMarked).toBe(true);
  });

  it('setDarkMode(true) sets darkMode to true', () => {
    useAppStore.getState().setDarkMode(true);
    expect(useAppStore.getState().darkMode).toBe(true);
  });

  it('setDarkMode(true) calls document.documentElement.classList.toggle', () => {
    const toggleSpy = vi.spyOn(document.documentElement.classList, 'toggle');
    useAppStore.getState().setDarkMode(true);
    expect(toggleSpy).toHaveBeenCalledWith('dark', true);
    toggleSpy.mockRestore();
  });

  it('toggleSectionOpen("s1") flips sectionOpen["s1"] from undefined to true (!undefined=true)', () => {
    useAppStore.getState().toggleSectionOpen('s1');
    // !undefined = true (JS coercion). First toggle sets explicit true.
    expect(useAppStore.getState().sectionOpen.s1).toBe(true);
  });

  it('toggleSectionOpen("s1") called again flips sectionOpen["s1"] from true to false', () => {
    useAppStore.getState().toggleSectionOpen('s1');
    useAppStore.getState().toggleSectionOpen('s1');
    expect(useAppStore.getState().sectionOpen.s1).toBe(false);
  });
});

describe('useAppStore — subscribe serialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(DEFAULT_STATE);
  });

  it('storageAdapter.write called with uiState.selectedDifficulties as Array', () => {
    useAppStore.setState({ selectedDifficulties: new Set(['novice']) });
    // subscribe fires after setState
    expect(storageAdapter.write).toHaveBeenCalled();
    const callArg = (
      storageAdapter.write as ReturnType<typeof vi.fn>
    ).mock.calls.at(-1)?.[0] as {
      uiState: { selectedDifficulties: unknown; selectedSections: unknown };
    };
    expect(Array.isArray(callArg.uiState.selectedDifficulties)).toBe(true);
    expect(Array.isArray(callArg.uiState.selectedSections)).toBe(true);
  });

  it('storageAdapter.write serializes sectionOpen in uiState', () => {
    useAppStore.getState().setSearchQuery('test');
    const callArg = (
      storageAdapter.write as ReturnType<typeof vi.fn>
    ).mock.calls.at(-1)?.[0] as {
      uiState: { searchQuery: string };
    };
    expect(callArg.uiState.searchQuery).toBe('test');
  });
});

describe('useAppStore — ScoringActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(DEFAULT_STATE);
  });

  it('setScore stores a numeric score', () => {
    useAppStore.getState().setScore('topic1-0', 5);
    expect(useAppStore.getState().scores['topic1-0']).toBe(5);
  });

  it('setScore stores null score', () => {
    useAppStore.getState().setScore('topic1-0', null);
    expect(useAppStore.getState().scores['topic1-0']).toBeNull();
  });

  it('setScore stores 0 (not falsy-filtered)', () => {
    useAppStore.getState().setScore('topic1-0', 0);
    expect(useAppStore.getState().scores['topic1-0']).toBe(0);
  });

  it('setOverride stores a numeric override', () => {
    useAppStore.getState().setOverride('topic1', 7.5);
    expect(useAppStore.getState().overrides.topic1).toBe(7.5);
  });

  it('setOverride stores null override', () => {
    useAppStore.getState().setOverride('topic1', null);
    expect(useAppStore.getState().overrides.topic1).toBeNull();
  });

  it('setNote stores a note string', () => {
    useAppStore.getState().setNote('topic1-2', 'hello');
    expect(useAppStore.getState().notes['topic1-2']).toBe('hello');
  });

  it('setTopicNote stores a topic note string', () => {
    useAppStore.getState().setTopicNote('topic1', 'topic note');
    expect(useAppStore.getState().topicNotes.topic1).toBe('topic note');
  });

  it('addCustomQuestion adds a new CustomQuestion to the array', () => {
    useAppStore.getState().addCustomQuestion({
      id: 'custom-t1-1',
      topicId: 't1',
      text: 'Q?',
      level: 'novice',
    });
    const cqs = useAppStore.getState().customQuestions;
    expect(cqs).toHaveLength(1);
    expect(cqs[0].id).toBe('custom-t1-1');
  });

  it('deleteCustomQuestion removes the entry from customQuestions', () => {
    useAppStore.getState().addCustomQuestion({
      id: 'custom-t1-1',
      topicId: 't1',
      text: 'Q?',
      level: 'novice',
    });
    useAppStore.getState().deleteCustomQuestion('custom-t1-1');
    expect(useAppStore.getState().customQuestions).toHaveLength(0);
  });

  it('setCandidate stores a candidate object', () => {
    const candidate = {
      name: 'Alice',
      email: 'alice@example.com',
      role: 'Engineer',
      date: '2026-01-01',
      interviewer: 'Bob',
      details: 'Strong candidate',
    };
    useAppStore.getState().setCandidate(candidate);
    expect(useAppStore.getState().candidate).toEqual(candidate);
  });

  it('setCandidate(null) sets candidate to null', () => {
    useAppStore.getState().setCandidate(null);
    expect(useAppStore.getState().candidate).toBeNull();
  });

  it('resetAll clears scores, overrides, notes, topicNotes, customQuestions, and candidate', () => {
    useAppStore.getState().setScore('q-1', 8);
    useAppStore.getState().setOverride('t-1', 7);
    useAppStore.getState().setNote('q-1', 'note');
    useAppStore.getState().setTopicNote('t-1', 'tnote');
    useAppStore.getState().addCustomQuestion({
      id: 'cq-1',
      topicId: 't1',
      text: 'Q',
      level: 'expert',
    });
    useAppStore.getState().setCandidate({
      name: 'Alice',
      email: '',
      role: '',
      date: '',
      interviewer: '',
      details: '',
    });
    useAppStore.getState().resetAll();
    const state = useAppStore.getState();
    expect(state.scores).toEqual({});
    expect(state.overrides).toEqual({});
    expect(state.notes).toEqual({});
    expect(state.topicNotes).toEqual({});
    expect(state.customQuestions).toEqual([]);
    expect(state.candidate).toBeNull();
  });

  it('resetAll clears selectedDifficulties, selectedSections, searchQuery, and hideMarked', () => {
    useAppStore.setState({
      selectedDifficulties: new Set(['expert']),
      selectedSections: new Set(['be']),
      searchQuery: 'foo',
      hideMarked: true,
    });
    useAppStore.getState().resetAll();
    const state = useAppStore.getState();
    expect(state.selectedDifficulties).toEqual(new Set());
    expect(state.selectedSections).toEqual(new Set());
    expect(state.searchQuery).toBe('');
    expect(state.hideMarked).toBe(false);
  });

  it('resetAll preserves activeSessionId', () => {
    useAppStore.setState({ activeSessionId: 'session-abc' });
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().activeSessionId).toBe('session-abc');
  });
});

// ---------------------------------------------------------------------------
// Session store actions — Phase 6
// ---------------------------------------------------------------------------

describe('session store actions', () => {
  const SESSION_ID_1 = 'sess-1';
  const SESSION_ID_2 = 'sess-2';

  const makeManifest = (
    sessions: Array<{ id: string; name: string }>,
    activeId: string,
  ) => ({
    version: 2 as const,
    activeSessionId: activeId,
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  });

  const makeSession = (id: string) => ({
    version: 3 as const,
    id,
    scores: { [`q-${id}`]: 5 },
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      ...DEFAULT_STATE,
      manifest: null,
      undoBuffer: null,
    });
    // Reset chrome.storage.local.remove mock (still used by StorageAdapter internally)
    chrome.storage.local.remove = vi.fn();
    // Reset storageAdapter.remove mock (deleteSession now routes through the adapter)
    (storageAdapter.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    // Default: storageAdapter.read returns empty object
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  // --- setManifest ---
  it('setManifest stores the manifest in the store', () => {
    const manifest = makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1);
    useAppStore.getState().setManifest(manifest);
    expect(useAppStore.getState().manifest).toEqual(manifest);
  });

  // --- setUndoBuffer ---
  it('setUndoBuffer stores a buffer in the store', () => {
    const meta = {
      id: SESSION_ID_1,
      name: 'Session 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const data = makeSession(SESSION_ID_1);
    const buf = { sessionMeta: meta, sessionData: data, wasActive: true };
    useAppStore.getState().setUndoBuffer(buf);
    expect(useAppStore.getState().undoBuffer).toEqual(buf);
  });

  it('setUndoBuffer(null) clears the buffer', () => {
    const meta = {
      id: SESSION_ID_1,
      name: 'Session 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const buf = { sessionMeta: meta, sessionData: makeSession(SESSION_ID_1), wasActive: false };
    useAppStore.getState().setUndoBuffer(buf);
    useAppStore.getState().setUndoBuffer(null);
    expect(useAppStore.getState().undoBuffer).toBeNull();
  });

  // --- switchSession (SESS-04: flushPending BEFORE setState) ---
  it('switchSession calls flushPending() before any set()', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    const session2Data = makeSession(SESSION_ID_2);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_2}`]: session2Data,
    });

    const callOrder: string[] = [];
    (storageAdapter.flushPending as ReturnType<typeof vi.fn>).mockImplementation(
      () => { callOrder.push('flushPending'); },
    );
    // Intercept the store's setState by spying on set - we track by recording when
    // flushPending was called relative to the activeSessionId change
    let flushCalledBeforeSwitch = false;
    let flushPendingCallCount = 0;

    (storageAdapter.flushPending as ReturnType<typeof vi.fn>).mockImplementation(() => {
      flushPendingCallCount += 1;
      // At flush time, activeSessionId should still be the OLD session
      if (useAppStore.getState().activeSessionId === SESSION_ID_1) {
        flushCalledBeforeSwitch = true;
      }
    });

    await useAppStore.getState().switchSession(SESSION_ID_2);

    expect(flushPendingCallCount).toBeGreaterThan(0);
    expect(flushCalledBeforeSwitch).toBe(true);
  });

  it('switchSession updates all per-session fields and activeSessionId in a single call', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    const session2Data = makeSession(SESSION_ID_2);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_2}`]: session2Data,
    });

    await useAppStore.getState().switchSession(SESSION_ID_2);

    const state = useAppStore.getState();
    expect(state.activeSessionId).toBe(SESSION_ID_2);
    expect(state.scores).toEqual(session2Data.scores);
    expect(state.manifest?.activeSessionId).toBe(SESSION_ID_2);
  });

  it('switchSession sets per-session fields to defaults when session data is missing', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });
    // read returns empty (no session data)
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().switchSession(SESSION_ID_2);

    const state = useAppStore.getState();
    expect(state.activeSessionId).toBe(SESSION_ID_2);
    expect(state.scores).toEqual({});
    expect(state.candidate).toBeNull();
  });

  // --- createSession (SESS-01: auto-name, manifest update, storage write) ---
  it('createSession adds a new SessionMeta to manifest.sessions', async () => {
    const manifest = makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1);
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });
    // switchSession inside createSession will try to read the new session
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().createSession();

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    expect(sessions).toHaveLength(2);
  });

  it('createSession auto-names "Session N" using highest existing number + 1', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_2,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_2 });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().createSession();

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    const newSession = sessions.find((s) => s.name === 'Session 3');
    expect(newSession).toBeDefined();
  });

  it('createSession writes the new session to storage via storageAdapter.write', async () => {
    const manifest = makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1);
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().createSession();

    const writeCalls = (storageAdapter.write as ReturnType<typeof vi.fn>).mock.calls;
    const sessionWrite = writeCalls.find((call: unknown[]) => {
      const arg = call[0] as Record<string, unknown>;
      return Object.keys(arg).some((k) => k.startsWith('session:'));
    });
    expect(sessionWrite).toBeDefined();
  });

  it('createSession switches to the new session after creating it', async () => {
    const manifest = makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1);
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().createSession();

    const state = useAppStore.getState();
    // activeSessionId should be the new session's id (not the old one)
    expect(state.activeSessionId).not.toBe(SESSION_ID_1);
    expect(state.manifest?.activeSessionId).toBe(state.activeSessionId);
  });

  // --- renameSession (SESS-01: updates name + updatedAt) ---
  it('renameSession updates the matching SessionMeta.name in manifest.sessions', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    await useAppStore.getState().renameSession(SESSION_ID_2, 'My Custom Name');

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    const renamed = sessions.find((s) => s.id === SESSION_ID_2);
    expect(renamed?.name).toBe('My Custom Name');
  });

  it('renameSession does not change other sessions', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    await useAppStore.getState().renameSession(SESSION_ID_2, 'New Name');

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    const untouched = sessions.find((s) => s.id === SESSION_ID_1);
    expect(untouched?.name).toBe('Session 1');
  });

  it('renameSession does not change activeSessionId', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    await useAppStore.getState().renameSession(SESSION_ID_2, 'New Name');

    expect(useAppStore.getState().activeSessionId).toBe(SESSION_ID_1);
  });

  // --- duplicateSession (SESS-01: reads from storage, NOT current Zustand state) ---
  it('duplicateSession reads session data from storageAdapter.read() by sessionId', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    const session2Data = makeSession(SESSION_ID_2);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_2}`]: session2Data,
    });

    await useAppStore.getState().duplicateSession(SESSION_ID_2);

    expect(storageAdapter.read).toHaveBeenCalledWith(
      expect.arrayContaining([`session:${SESSION_ID_2}`]),
    );
  });

  it('duplicateSession creates a new session named "{original} (copy)"', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    const session2Data = makeSession(SESSION_ID_2);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_2}`]: session2Data,
    });

    await useAppStore.getState().duplicateSession(SESSION_ID_2);

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    const copy = sessions.find((s) => s.name === 'Session 2 (copy)');
    expect(copy).toBeDefined();
  });

  it('duplicateSession does NOT change activeSessionId', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_1,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_2}`]: makeSession(SESSION_ID_2),
    });

    await useAppStore.getState().duplicateSession(SESSION_ID_2);

    expect(useAppStore.getState().activeSessionId).toBe(SESSION_ID_1);
  });

  // --- deleteSession (SESS-01/SESS-04: undo buffer captured BEFORE remove) ---
  it('deleteSession captures undoBuffer from storage BEFORE calling chrome.storage.local.remove', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_2,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_2 });

    const session1Data = makeSession(SESSION_ID_1);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_1}`]: session1Data,
    });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_1}`]: session1Data,
      [`session:${SESSION_ID_2}`]: makeSession(SESSION_ID_2),
    });

    const callOrder: string[] = [];
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockImplementation(async (keys: string[]) => {
      callOrder.push(`read:${keys[0]}`);
      if (keys[0] === `session:${SESSION_ID_1}`) {
        return { [`session:${SESSION_ID_1}`]: session1Data };
      }
      return {};
    });
    // deleteSession now routes through storageAdapter.remove() — track that instead
    (storageAdapter.remove as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('remove');
    });

    await useAppStore.getState().deleteSession(SESSION_ID_1);

    const readIndex = callOrder.findIndex((c) => c.startsWith('read:'));
    const removeIndex = callOrder.findIndex((c) => c === 'remove');
    expect(readIndex).toBeLessThan(removeIndex);
  });

  it('deleteSession sets undoBuffer with sessionMeta, sessionData, and wasActive', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_2,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_2 });

    const session1Data = makeSession(SESSION_ID_1);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_1}`]: session1Data,
    });
    chrome.storage.local.remove = vi.fn().mockResolvedValue(undefined);

    await useAppStore.getState().deleteSession(SESSION_ID_1);

    const undo = useAppStore.getState().undoBuffer;
    expect(undo).not.toBeNull();
    expect(undo?.sessionMeta.id).toBe(SESSION_ID_1);
    expect(undo?.sessionData).toEqual(session1Data);
    expect(undo?.wasActive).toBe(false); // SESSION_ID_1 was NOT the active session
  });

  it('deleteSession removes the session from manifest.sessions', async () => {
    const manifest = makeManifest(
      [
        { id: SESSION_ID_1, name: 'Session 1' },
        { id: SESSION_ID_2, name: 'Session 2' },
      ],
      SESSION_ID_2,
    );
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_2 });

    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_1}`]: makeSession(SESSION_ID_1),
    });
    chrome.storage.local.remove = vi.fn().mockResolvedValue(undefined);

    await useAppStore.getState().deleteSession(SESSION_ID_1);

    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    expect(sessions.find((s) => s.id === SESSION_ID_1)).toBeUndefined();
  });

  it('deleteSession auto-switches to most-recently-updated remaining session when active session is deleted', async () => {
    const manifest = {
      version: 2 as const,
      activeSessionId: SESSION_ID_1,
      sessions: [
        { id: SESSION_ID_1, name: 'Session 1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: SESSION_ID_2, name: 'Session 2', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
      ],
    };
    useAppStore.setState({ ...DEFAULT_STATE, manifest, activeSessionId: SESSION_ID_1 });

    const session2Data = makeSession(SESSION_ID_2);
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockImplementation(async (keys: string[]) => {
      if (keys[0] === `session:${SESSION_ID_1}`) return { [`session:${SESSION_ID_1}`]: makeSession(SESSION_ID_1) };
      if (keys[0] === `session:${SESSION_ID_2}`) return { [`session:${SESSION_ID_2}`]: session2Data };
      return {};
    });
    chrome.storage.local.remove = vi.fn().mockResolvedValue(undefined);

    await useAppStore.getState().deleteSession(SESSION_ID_1);

    expect(useAppStore.getState().activeSessionId).toBe(SESSION_ID_2);
  });

  // --- undoDeleteSession ---
  it('undoDeleteSession re-writes session data to storage and re-inserts sessionMeta', async () => {
    const meta = {
      id: SESSION_ID_1,
      name: 'Session 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const data = makeSession(SESSION_ID_1);
    const manifest = makeManifest([{ id: SESSION_ID_2, name: 'Session 2' }], SESSION_ID_2);
    useAppStore.setState({
      ...DEFAULT_STATE,
      manifest,
      activeSessionId: SESSION_ID_2,
      undoBuffer: { sessionMeta: meta, sessionData: data, wasActive: false },
    });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await useAppStore.getState().undoDeleteSession();

    // Session should be re-inserted into manifest
    const sessions = useAppStore.getState().manifest?.sessions ?? [];
    expect(sessions.find((s) => s.id === SESSION_ID_1)).toBeDefined();
    // storageAdapter.write should have been called with the session data
    const writeCalls = (storageAdapter.write as ReturnType<typeof vi.fn>).mock.calls;
    const sessionWrite = writeCalls.find((call: unknown[]) => {
      const arg = call[0] as Record<string, unknown>;
      return Object.keys(arg).some((k) => k === `session:${SESSION_ID_1}`);
    });
    expect(sessionWrite).toBeDefined();
    // undoBuffer should be cleared
    expect(useAppStore.getState().undoBuffer).toBeNull();
  });

  it('undoDeleteSession switches back to restored session when wasActive=true', async () => {
    const meta = {
      id: SESSION_ID_1,
      name: 'Session 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const data = makeSession(SESSION_ID_1);
    const manifest = makeManifest([{ id: SESSION_ID_2, name: 'Session 2' }], SESSION_ID_2);
    useAppStore.setState({
      ...DEFAULT_STATE,
      manifest,
      activeSessionId: SESSION_ID_2,
      undoBuffer: { sessionMeta: meta, sessionData: data, wasActive: true },
    });
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({
      [`session:${SESSION_ID_1}`]: data,
    });

    await useAppStore.getState().undoDeleteSession();

    expect(useAppStore.getState().activeSessionId).toBe(SESSION_ID_1);
  });

  // --- Subscribe callback: manifest write ---
  it('subscribe writes manifest to storage when manifest is non-null', () => {
    const manifest = makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1);
    useAppStore.setState({ manifest });

    const writeCalls = (storageAdapter.write as ReturnType<typeof vi.fn>).mock.calls;
    const manifestWrite = writeCalls.find((call: unknown[]) => {
      const arg = call[0] as Record<string, unknown>;
      return 'manifest' in arg;
    });
    expect(manifestWrite).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// importSession — Phase 7 (YAML-02 / YAML-03)
// ---------------------------------------------------------------------------

describe('importSession', () => {
  const SESSION_ID_1 = 'sess-import-1';

  const makeManifest = (
    sessions: Array<{ id: string; name: string }>,
    activeId: string,
  ) => ({
    version: 2 as const,
    activeSessionId: activeId,
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  });

  const makeImportData = (overrides?: Partial<{
    scores: Record<string, number | null>;
    sessionName: string;
    candidate: null;
  }>) => ({
    scores: { 'twig-0': 8, 'twig-1': 7 },
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
    sessionName: '',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      ...DEFAULT_STATE,
      manifest: makeManifest([{ id: SESSION_ID_1, name: 'Session 1' }], SESSION_ID_1),
      activeSessionId: SESSION_ID_1,
    });
    // Default: storageAdapter.read returns empty object (for createSession → switchSession)
    (storageAdapter.read as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (storageAdapter.snapshot as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('importSession(data, false) — storageAdapter.snapshot is called once before createSession', async () => {
    const callOrder: string[] = [];
    (storageAdapter.snapshot as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('snapshot');
    });
    (storageAdapter.write as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('write');
    });

    await useAppStore.getState().importSession(makeImportData(), false);

    expect(callOrder[0]).toBe('snapshot');
    expect(storageAdapter.snapshot).toHaveBeenCalledTimes(1);
  });

  it('importSession(data, false) — after action, activeSessionId differs from pre-import id', async () => {
    const priorId = useAppStore.getState().activeSessionId;
    await useAppStore.getState().importSession(makeImportData(), false);
    const newId = useAppStore.getState().activeSessionId;
    expect(newId).not.toBe(priorId);
  });

  it('importSession(data, false) with sessionName — renameSession is called with that name', async () => {
    const data = makeImportData({ sessionName: 'Alice Smith' });
    await useAppStore.getState().importSession(data, false);
    // After renameSession, the active session should have the imported name
    const state = useAppStore.getState();
    const activeMeta = state.manifest?.sessions.find((s) => s.id === state.activeSessionId);
    expect(activeMeta?.name).toBe('Alice Smith');
  });

  it('importSession(data, true) — storageAdapter.snapshot is called once before set()', async () => {
    const callOrder: string[] = [];
    (storageAdapter.snapshot as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('snapshot');
    });
    (storageAdapter.write as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('write');
    });

    await useAppStore.getState().importSession(makeImportData(), true);

    expect(callOrder[0]).toBe('snapshot');
    expect(storageAdapter.snapshot).toHaveBeenCalledTimes(1);
  });

  it('importSession(data, true) — after action, activeSessionId remains the same', async () => {
    const priorId = useAppStore.getState().activeSessionId;
    await useAppStore.getState().importSession(makeImportData(), true);
    expect(useAppStore.getState().activeSessionId).toBe(priorId);
  });

  it('importSession(data, true) — store state.scores matches data.scores after action', async () => {
    const data = makeImportData({ scores: { 'twig-0': 9, 'twig-4': 6 } });
    await useAppStore.getState().importSession(data, true);
    expect(useAppStore.getState().scores).toEqual(data.scores);
  });

  it('importSession — snapshot is called BEFORE any write mutation (call-order spy)', async () => {
    const callOrder: string[] = [];
    (storageAdapter.snapshot as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('snapshot');
    });
    (storageAdapter.write as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callOrder.push('write');
    });

    await useAppStore.getState().importSession(makeImportData(), true);

    expect(callOrder[0]).toBe('snapshot');
  });
});
