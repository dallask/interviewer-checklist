import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
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
    ...overrides,
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders backdrop with aria-hidden="true" when sidebarOpen=true', () => {
    render(<Sidebar />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('does not render backdrop when sidebarOpen=false', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState({ sidebarOpen: false })),
    );
    render(<Sidebar />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeInTheDocument();
  });
});
