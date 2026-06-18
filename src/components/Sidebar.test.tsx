import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { Sidebar } from './Sidebar.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../scoring/index.js', () => ({
  computeOverallMark: vi.fn(() => ({
    mark: null,
    band: 'none',
    scoredTopics: 0,
    totalTopics: 0,
  })),
  computeTopicMark: vi.fn(() => ({
    mark: null,
    band: 'none',
    scoredCount: 0,
    totalCount: 0,
  })),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
    topicOpen: {},
    sectionOpen: {},
    groupOpen: {
      search: true,
      difficulty: true,
      sections: true,
      actions: true,
    },
    toggleGroup: vi.fn(),
    setSearchQuery: vi.fn(),
    searchQuery: '',
    selectedDifficulties: new Set(),
    selectedSections: new Set(),
    toggleDifficulty: vi.fn(),
    toggleSection: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    hideMarked: false,
    setHideMarked: vi.fn(),
    darkMode: false,
    setDarkMode: vi.fn(),
    // Phase 5 scoring state — required by SectionFilter (live marks)
    scores: {},
    overrides: {},
    customQuestions: [],
    // Phase 14: SearchGroup reads sections from store (V4Section[])
    sections: [],
    // WR-02: ActionsGroup fields — prevents undefined selectors from silently
    // returning undefined when ActionsGroup is rendered inside Sidebar.
    manifest: null,
    activeSessionId: '',
    notes: {},
    topicNotes: {},
    candidate: { name: '', role: '' },
    hideNotes: false,
    setHideNotes: vi.fn(),
    removedDefaultQuestionIds: new Set<string>(),
    ...overrides,
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // SidebarFooter (added in Phase 9 Plan 09-02) calls
    // chrome.runtime.getManifest() synchronously during render; provide a
    // default mock so the Sidebar test suite continues to render the tree.
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.0.0',
    } as chrome.runtime.Manifest);
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState()),
    );
  });

  it('renders aside with role="complementary" and aria-label="Filters"', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute('aria-label', 'Filters');
  });

  it('has translate-x-0 class when sidebarOpen=true', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('translate-x-0');
    expect(aside.className).not.toContain('-translate-x-full');
  });

  it('has -translate-x-full class when sidebarOpen=false', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState({ sidebarOpen: false })),
    );
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('-translate-x-full');
  });

  it('has motion-reduce:transition-none class on aside', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('motion-reduce:transition-none');
  });

  // CR-03 (REVIEW.md): backdrop ownership moved to App.tsx — Sidebar no
  // longer renders its own `fixed inset-0` overlay. Backdrop visibility is
  // exercised by App-level tests/UAT, not by this component test suite.
  it('does not render a backdrop (owned by App.tsx after CR-03)', () => {
    render(<Sidebar />);
    // Check that no `fixed inset-0` backdrop overlay div exists inside Sidebar.
    // Note: icon spans inside SidebarGroup legitimately use aria-hidden="true"
    // (added in Phase 12 UI-11), so we query specifically for the backdrop pattern.
    const backdrop = document.querySelector('div.fixed.inset-0[aria-hidden="true"]');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('renders SidebarHeader inside aside', () => {
    render(<Sidebar />);
    // SidebarHeader renders the Close sidebar toggle button
    const toggleBtn = screen.getByRole('button', { name: 'Close sidebar' });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('inner scrollable div has overflow-y-auto class', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    const scrollDiv = aside.querySelector('.overflow-y-auto');
    expect(scrollDiv).not.toBeNull();
  });
});
