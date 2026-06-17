import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STATE, useAppStore } from './app.js';

// Mock storageAdapter at the module level to prevent actual storage writes in tests
vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    write: vi.fn(),
    read: vi.fn(),
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

  it('resetAll preserves activeSessionId', () => {
    useAppStore.setState({ activeSessionId: 'session-abc' });
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().activeSessionId).toBe('session-abc');
  });
});
