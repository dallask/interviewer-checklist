import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionsGroup } from './ActionsGroup.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('ActionsGroup', () => {
  const expandAll = vi.fn();
  const collapseAll = vi.fn();
  const setHideMarked = vi.fn();
  const setDarkMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: false,
        setDarkMode,
      }),
    );
  });

  it('renders Expand all button that calls expandAll', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /expand all/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(expandAll).toHaveBeenCalledTimes(1);
  });

  it('renders Collapse all button that calls collapseAll', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /collapse all/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(collapseAll).toHaveBeenCalledTimes(1);
  });

  it('Hide marked topics button has aria-pressed="false" always in Phase 4', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /hide marked topics/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('dark mode toggle shows "Dark mode" when darkMode=false', () => {
    render(<ActionsGroup />);
    expect(
      screen.getByRole('button', { name: /dark mode/i }),
    ).toBeInTheDocument();
  });

  it('dark mode toggle shows "Light mode" when darkMode=true', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: true,
        setDarkMode,
      }),
    );
    render(<ActionsGroup />);
    expect(
      screen.getByRole('button', { name: /light mode/i }),
    ).toBeInTheDocument();
  });

  it('dark mode toggle button has aria-pressed reflecting darkMode', () => {
    render(<ActionsGroup />);
    const darkBtn = screen.getByRole('button', { name: /dark mode/i });
    expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('dark mode toggle button has aria-pressed="true" when darkMode=true', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: true,
        setDarkMode,
      }),
    );
    render(<ActionsGroup />);
    const lightBtn = screen.getByRole('button', { name: /light mode/i });
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking dark mode toggle calls setDarkMode with toggled value', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /dark mode/i });
    fireEvent.click(btn);
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });

  it('all buttons have focus-visible ring classes', () => {
    render(<ActionsGroup />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-blue-500');
    }
  });

  it('renders "Candidate details" button with id="open-candidate-modal"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /candidate details/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-candidate-modal');
  });

  it('"Candidate details" button has correct styling classes', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /candidate details/i });
    expect(btn.className).toContain('text-gray-900');
    expect(btn.className).toContain('bg-gray-100');
  });

  it('renders "Reset all" button with id="open-reset-dialog"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /reset all/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-reset-dialog');
  });

  it('"Reset all" button has text-red-600 class', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /reset all/i });
    expect(btn.className).toContain('text-red-600');
  });
});
