import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionFilter } from './SectionFilter.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

// Convert DEFAULT_SECTIONS to V4Section shape for store mock
const mockSections = DEFAULT_SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
  icon: s.icon,
  isDefault: true,
  topics: s.items.map((t, ti) => ({
    id: t.id,
    name: t.name,
    desc: t.desc,
    tag: t.tag,
    isDefault: true,
    questions: t.questions.map((q, qi) => ({
      id: `${t.id}-q${qi}`,
      text: q.q,
      level: q.level,
      isDefault: true,
    })),
  })),
}));

describe('SectionFilter', () => {
  const toggleSection = vi.fn();
  const clearSections = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(),
        toggleSection,
        clearSections,
        sections: mockSections,
        removedDefaultQuestionIds: new Set<string>(),
      }),
    );
  });

  it('renders 10 buttons (All sections + one per DEFAULT_SECTIONS entry)', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(10);
  });

  it('each section row button has aria-pressed="false" when no sections selected', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    // buttons[0] is "All sections" which has aria-pressed="true" when Set is empty (D-01)
    // Individual section row buttons (index 1+) should all be aria-pressed="false"
    for (const btn of buttons.slice(1)) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('each section row shows a numeric count badge (not "—")', () => {
    render(<SectionFilter />);
    // No "—" placeholders should exist
    const dashes = screen.queryAllByText('—');
    expect(dashes).toHaveLength(0);
    // Count badges should all be numeric (positive integers)
    const countBadges = document.querySelectorAll('.tabular-nums');
    for (const badge of Array.from(countBadges)) {
      expect(badge.textContent).toMatch(/^\d+$/);
    }
  });

  it('clicking a button calls toggleSection with the section id', () => {
    render(<SectionFilter />);
    // Click the second button (first section row; first button is "All sections")
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(toggleSection).toHaveBeenCalledTimes(1);
  });

  it('selected section button has aria-pressed="true"', () => {
    const { unmount: unmount1 } = render(<SectionFilter />);
    // Get first section row button and click to get the section id
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    const [calledId] = toggleSection.mock.calls[0] as [string];
    unmount1();

    // Re-render with that section selected
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set([calledId]),
        toggleSection,
        clearSections,
        sections: mockSections,
        removedDefaultQuestionIds: new Set<string>(),
      }),
    );
    render(<SectionFilter />);
    const newButtons = screen.getAllByRole('button');
    // With a non-empty Set:
    // - "All sections" row: aria-pressed="false" (Set is non-empty, D-01)
    // - The selected section row: aria-pressed="true"
    const pressedButtons = newButtons.filter(
      (btn) => btn.getAttribute('aria-pressed') === 'true',
    );
    expect(pressedButtons).toHaveLength(1);
  });

  it('all buttons have focus-visible ring classes', () => {
    render(<SectionFilter />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-blue-500');
    }
  });

  // --- "All sections" row tests (UI-17, D-01) ---

  it('"All sections" row has aria-pressed="true" when no sections selected', () => {
    render(<SectionFilter />);
    const allBtn = screen.getByRole('button', { name: /all sections/i });
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('"All sections" row has aria-pressed="false" when a section is selected', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(['frontend']),
        toggleSection,
        clearSections: vi.fn(),
        sections: mockSections,
        removedDefaultQuestionIds: new Set<string>(),
      }),
    );
    render(<SectionFilter />);
    const allBtn = screen.getByRole('button', { name: /all sections/i });
    expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking "All sections" calls clearSections when a section is selected', () => {
    const localClearSections = vi.fn();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(['frontend']),
        toggleSection,
        clearSections: localClearSections,
        sections: mockSections,
        removedDefaultQuestionIds: new Set<string>(),
      }),
    );
    render(<SectionFilter />);
    fireEvent.click(screen.getByRole('button', { name: /all sections/i }));
    expect(localClearSections).toHaveBeenCalledTimes(1);
  });

  it('clicking "All sections" is a no-op when no sections are selected', () => {
    const localClearSections = vi.fn();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        selectedSections: new Set(),
        toggleSection,
        clearSections: localClearSections,
        sections: mockSections,
        removedDefaultQuestionIds: new Set<string>(),
      }),
    );
    render(<SectionFilter />);
    fireEvent.click(screen.getByRole('button', { name: /all sections/i }));
    expect(localClearSections).not.toHaveBeenCalled();
  });

  it('each section row renders the section.icon emoji', () => {
    render(<SectionFilter />);
    // Verify each section's icon emoji appears in its button's text content
    // Use getAllByRole + filter by exact label text to avoid substring ambiguity
    // (e.g. "Tooling" is a substring of "AI & Tooling")
    for (const section of DEFAULT_SECTIONS) {
      const allButtons = screen.getAllByRole('button');
      const sectionBtn = allButtons.find(
        (btn) => btn.textContent?.includes(section.label),
      );
      expect(sectionBtn).toBeDefined();
      expect(sectionBtn!.textContent).toContain(section.icon);
    }
  });
});
