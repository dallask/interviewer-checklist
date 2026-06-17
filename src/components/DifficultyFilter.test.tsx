import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DifficultyFilter } from './DifficultyFilter.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('DifficultyFilter', () => {
  const toggleDifficulty = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(),
        toggleDifficulty,
      }),
    );
  });

  it('renders four difficulty buttons', () => {
    render(<DifficultyFilter />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('each button has aria-pressed="false" when no difficulties selected', () => {
    render(<DifficultyFilter />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('novice button has aria-pressed="true" when novice is selected', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(['novice']),
        toggleDifficulty,
      }),
    );
    render(<DifficultyFilter />);
    const noviceBtn = screen.getByRole('button', { name: /beginner/i });
    expect(noviceBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a button calls toggleDifficulty with correct level', () => {
    render(<DifficultyFilter />);
    const noviceBtn = screen.getByRole('button', { name: /beginner/i });
    fireEvent.click(noviceBtn);
    expect(toggleDifficulty).toHaveBeenCalledWith('novice');
  });

  it('renders beginner, intermediate, advanced, expert buttons', () => {
    render(<DifficultyFilter />);
    expect(screen.getByRole('button', { name: /beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /intermediate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /advanced/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expert/i })).toBeInTheDocument();
  });

  it('all buttons have focus-visible ring classes', () => {
    render(<DifficultyFilter />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-blue-500');
    }
  });
});
