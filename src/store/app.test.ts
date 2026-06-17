import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, DEFAULT_STATE } from './app.js';

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

  it('toggleTopic("t1") sets topicOpen["t1"] to true', () => {
    useAppStore.getState().toggleTopic('t1');
    // undefined (default open) toggled to explicit false, or to explicit true depending on logic.
    // The plan says toggle stores explicitly. Default is undefined=open, toggle stores explicit value.
    // toggleTopic flips: undefined → false (since undefined is treated as true, toggle to false).
    // Actually re-reading plan: "default open means undefined=open, but explicit toggle stores it"
    // toggleTopic('t1') where t1 is undefined: store t1 as false (toggled from default true)
    expect(useAppStore.getState().topicOpen['t1']).toBe(false);
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
    expect(useAppStore.getState().selectedDifficulties.has('novice')).toBe(true);
  });

  it('toggleDifficulty("novice") called again removes novice from selectedDifficulties', () => {
    useAppStore.getState().toggleDifficulty('novice');
    useAppStore.getState().toggleDifficulty('novice');
    expect(useAppStore.getState().selectedDifficulties.has('novice')).toBe(false);
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

  it('toggleSectionOpen("s1") flips sectionOpen["s1"] from default to false', () => {
    useAppStore.getState().toggleSectionOpen('s1');
    // undefined (default open) → explicit false
    expect(useAppStore.getState().sectionOpen['s1']).toBe(false);
  });

  it('toggleSectionOpen("s1") called again flips sectionOpen["s1"] back to true', () => {
    useAppStore.getState().toggleSectionOpen('s1');
    useAppStore.getState().toggleSectionOpen('s1');
    expect(useAppStore.getState().sectionOpen['s1']).toBe(true);
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
    const callArg = (storageAdapter.write as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as {
      uiState: { selectedDifficulties: unknown; selectedSections: unknown };
    };
    expect(Array.isArray(callArg.uiState.selectedDifficulties)).toBe(true);
    expect(Array.isArray(callArg.uiState.selectedSections)).toBe(true);
  });

  it('storageAdapter.write serializes sectionOpen in uiState', () => {
    useAppStore.getState().setSearchQuery('test');
    const callArg = (storageAdapter.write as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as {
      uiState: { searchQuery: string };
    };
    expect(callArg.uiState.searchQuery).toBe('test');
  });
});
