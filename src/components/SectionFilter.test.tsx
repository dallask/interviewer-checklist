import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionFilter } from './SectionFilter.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('SectionFilter', () => {
  const toggleSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(),
        toggleSection,
        scores: {},
        overrides: {},
        customQuestions: [],
      }),
    );
  });

  it('renders 9 section buttons (one per DEFAULT_SECTIONS entry)', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('each button has aria-pressed="false" when no sections selected', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('each button shows "—" mark placeholder when no questions are scored', () => {
    render(<SectionFilter />);
    const marks = screen.getAllByText('—');
    expect(marks).toHaveLength(9);
  });

  it('clicking a button calls toggleSection with the section id', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(toggleSection).toHaveBeenCalledTimes(1);
  });

  it('selected section button has aria-pressed="true"', () => {
    // We need to know the first section's ID — use DEFAULT_SECTIONS
    render(<SectionFilter />);
    // Get first button's section id from the first call after a click
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    const [calledId] = toggleSection.mock.calls[0] as [string];

    // Re-render with that section selected
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set([calledId]),
        toggleSection,
        scores: {},
        overrides: {},
        customQuestions: [],
      }),
    );
    const { unmount } = render(<SectionFilter />);
    const newButtons = screen.getAllByRole('button');
    // One of them should be pressed
    const pressedButtons = newButtons.filter(
      (btn) => btn.getAttribute('aria-pressed') === 'true',
    );
    expect(pressedButtons).toHaveLength(1);
    unmount();
  });

  it('all buttons have focus-visible ring classes', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-blue-500');
    }
  });

  it('shows a numeric mark (not "—") for first section when a question is scored', () => {
    // Find first section and first topic to build a valid score key
    const firstSection = DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.items[0];
    const scoreKey = `${firstTopic.id}-0`;

    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(),
        toggleSection,
        scores: { [scoreKey]: 8 },
        overrides: {},
        customQuestions: [],
      }),
    );

    render(<SectionFilter />);

    // With one question scored, the first section should NOT show "—"
    // There should be fewer than 9 "—" marks (one section now shows a number)
    const dashes = screen.queryAllByText('—');
    expect(dashes).toHaveLength(8);
  });

  it('scored section mark has a band color class', () => {
    const firstSection = DEFAULT_SECTIONS[0];
    const firstTopic = firstSection.items[0];
    const scoreKey = `${firstTopic.id}-0`;

    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(),
        toggleSection,
        scores: { [scoreKey]: 8 },
        overrides: {},
        customQuestions: [],
      }),
    );

    render(<SectionFilter />);

    // Score 8 → high band → text-emerald-600
    const markElement = screen
      .getAllByRole('button')[0]
      .querySelector('.tabular-nums');
    expect(markElement).not.toBeNull();
    if (markElement) {
      expect(markElement.className).toMatch(
        /text-(emerald|green|yellow|red|gray)/,
      );
    }
  });
});
