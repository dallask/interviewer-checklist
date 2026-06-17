import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('Sidebar', () => {
  const setSidebarOpen = vi.fn();
  const toggleGroup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        sidebarOpen: true,
        setSidebarOpen,
        groupOpen: { search: true, difficulty: true, sections: true, actions: true },
        toggleGroup,
      }),
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
      selector({
        sidebarOpen: false,
        setSidebarOpen,
        groupOpen: { search: true, difficulty: true, sections: true, actions: true },
        toggleGroup,
      }),
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
      selector({
        sidebarOpen: false,
        setSidebarOpen,
        groupOpen: { search: true, difficulty: true, sections: true, actions: true },
        toggleGroup,
      }),
    );
    render(<Sidebar />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeInTheDocument();
  });
});
