import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DifficultyFilter } from './DifficultyFilter.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('DifficultyFilter', () => {
  const toggleDifficulty = vi.fn();
  const clearDifficulties = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(),
        toggleDifficulty,
        clearDifficulties,
      }),
    );
  });

  it('renders five buttons (All levels + 4 difficulties)', () => {
    render(<DifficultyFilter />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('each difficulty button has aria-pressed="false" when no difficulties selected', () => {
    render(<DifficultyFilter />);
    // Individual difficulty buttons should be not-pressed when Set is empty
    const noviceBtn = screen.getByRole('button', { name: /novice/i });
    expect(noviceBtn).toHaveAttribute('aria-pressed', 'false');
    const intermediateBtn = screen.getByRole('button', { name: /intermediate/i });
    expect(intermediateBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('novice button has aria-pressed="true" when novice is selected', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(['novice']),
        toggleDifficulty,
        clearDifficulties,
      }),
    );
    render(<DifficultyFilter />);
    const noviceBtn = screen.getByRole('button', { name: /novice/i });
    expect(noviceBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a button calls toggleDifficulty with correct level', () => {
    render(<DifficultyFilter />);
    const noviceBtn = screen.getByRole('button', { name: /novice/i });
    fireEvent.click(noviceBtn);
    expect(toggleDifficulty).toHaveBeenCalledWith('novice');
  });

  it('renders novice, intermediate, advanced, expert buttons', () => {
    render(<DifficultyFilter />);
    expect(
      screen.getByRole('button', { name: /novice/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /intermediate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /advanced/i }),
    ).toBeInTheDocument();
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

  // --- "All levels" row tests (UI-16, D-01) ---

  it('"All levels" row has aria-pressed="true" when no difficulties selected', () => {
    render(<DifficultyFilter />);
    const allBtn = screen.getByRole('button', { name: /all levels/i });
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('"All levels" row has aria-pressed="false" when a difficulty is selected', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(['novice']),
        toggleDifficulty,
        clearDifficulties: vi.fn(),
      }),
    );
    render(<DifficultyFilter />);
    const allBtn = screen.getByRole('button', { name: /all levels/i });
    expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking "All levels" calls clearDifficulties when a difficulty is selected', () => {
    const localClearDifficulties = vi.fn();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(['novice']),
        toggleDifficulty,
        clearDifficulties: localClearDifficulties,
      }),
    );
    render(<DifficultyFilter />);
    fireEvent.click(screen.getByRole('button', { name: /all levels/i }));
    expect(localClearDifficulties).toHaveBeenCalledTimes(1);
  });

  it('clicking "All levels" is a no-op when no difficulties are selected', () => {
    const localClearDifficulties = vi.fn();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedDifficulties: new Set(),
        toggleDifficulty,
        clearDifficulties: localClearDifficulties,
      }),
    );
    render(<DifficultyFilter />);
    fireEvent.click(screen.getByRole('button', { name: /all levels/i }));
    expect(localClearDifficulties).not.toHaveBeenCalled();
  });

  it('each difficulty row renders a color dot span', () => {
    render(<DifficultyFilter />);
    // Novice — green dot
    const noviceBtn = screen.getByRole('button', { name: /novice/i });
    const noviceDot = noviceBtn.querySelector('.bg-green-500');
    expect(noviceDot).not.toBeNull();

    // Intermediate — blue dot
    const intermediateBtn = screen.getByRole('button', { name: /intermediate/i });
    const intermediateDot = intermediateBtn.querySelector('.bg-blue-500');
    expect(intermediateDot).not.toBeNull();

    // Advanced — orange dot
    const advancedBtn = screen.getByRole('button', { name: /advanced/i });
    const advancedDot = advancedBtn.querySelector('.bg-orange-500');
    expect(advancedDot).not.toBeNull();

    // Expert — pink dot
    const expertBtn = screen.getByRole('button', { name: /expert/i });
    const expertDot = expertBtn.querySelector('.bg-pink-500');
    expect(expertDot).not.toBeNull();
  });
});
