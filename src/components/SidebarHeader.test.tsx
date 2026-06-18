import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { SidebarHeader } from './SidebarHeader.js';

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
    sections: [],
    scores: {},
    overrides: {},
    customQuestions: [],
    ...overrides,
  };
}

describe('SidebarHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.0.0',
    } as chrome.runtime.Manifest);
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState()),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    expect(() => {
      render(<SidebarHeader onCandidateClick={vi.fn()} />);
    }).not.toThrow();
  });

  it('renders toggle button with aria-label "Close sidebar"', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Close sidebar' });
    expect(btn).toBeInTheDocument();
  });

  it('toggle button has aria-expanded=true when sidebarOpen=true', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Close sidebar' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggle button calls setSidebarOpen(false) when clicked', () => {
    const setSidebarOpen = vi.fn();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState({ setSidebarOpen })),
    );
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Close sidebar' });
    fireEvent.click(btn);
    expect(setSidebarOpen).toHaveBeenCalledWith(false);
  });

  it('renders candidate button with aria-label "Candidate details"', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Candidate details' });
    expect(btn).toBeInTheDocument();
  });

  it('candidate button calls onCandidateClick on click', () => {
    const onCandidateClick = vi.fn();
    render(<SidebarHeader onCandidateClick={onCandidateClick} />);
    const btn = screen.getByRole('button', { name: 'Candidate details' });
    fireEvent.click(btn);
    expect(onCandidateClick).toHaveBeenCalledTimes(1);
  });

  it('renders "Final mark" progress text', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    expect(screen.getByText(/Final mark/)).toBeInTheDocument();
  });

  it('mark badge shows "—" when no topics scored', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders progress bar element', () => {
    render(<SidebarHeader onCandidateClick={vi.fn()} />);
    const bar = document.querySelector('.h-1.bg-blue-500');
    expect(bar).not.toBeNull();
  });
});
