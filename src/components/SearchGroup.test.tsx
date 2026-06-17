import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchGroup } from './SearchGroup.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('SearchGroup', () => {
  const setSearchQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        setSearchQuery,
        searchQuery: '',
        filteredCount: 1067,
        totalCount: 1067,
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with type="search" and aria-label="Search questions"', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('aria-label', 'Search questions');
  });

  it('has aria-live="polite" aria-atomic="true" on result count element', () => {
    render(<SearchGroup />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('does NOT call setSearchQuery immediately on input change', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(setSearchQuery).not.toHaveBeenCalled();
  });

  it('calls setSearchQuery after 150ms debounce', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(setSearchQuery).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(setSearchQuery).toHaveBeenCalledWith('react');
  });

  it('resets debounce on rapid typing — only final value is sent', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'r' } });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    fireEvent.change(input, { target: { value: 're' } });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    fireEvent.change(input, { target: { value: 'react' } });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(setSearchQuery).toHaveBeenCalledTimes(1);
    expect(setSearchQuery).toHaveBeenCalledWith('react');
  });

  it('shows clear button when input has value', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(
      screen.getByRole('button', { name: /clear search/i }),
    ).toBeInTheDocument();
  });

  it('hides clear button when input is empty', () => {
    render(<SearchGroup />);
    expect(
      screen.queryByRole('button', { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });

  it('clicking clear button clears input and calls setSearchQuery immediately', () => {
    render(<SearchGroup />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'react' } });
    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });
});
