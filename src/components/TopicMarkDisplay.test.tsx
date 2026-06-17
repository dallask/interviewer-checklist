import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopicMarkDisplay } from './TopicMarkDisplay.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const mockTopic = {
  id: 'react',
  name: 'React',
  desc: 'React fundamentals',
  tag: 'react',
  questions: [
    { q: 'What is JSX?', level: 'intermediate' as const },
    { q: 'What are hooks?', level: 'advanced' as const },
  ],
};

describe('TopicMarkDisplay', () => {
  const setOverride = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        overrides: {},
        customQuestions: [],
        setOverride,
      }),
    );
  });

  it('renders a group with aria-label "Mark for React"', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const group = screen.getByRole('group', { name: 'Mark for React' });
    expect(group).toBeInTheDocument();
  });

  it('displays "—" when no questions are scored', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders override number input with aria-label "Override mark for React"', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('override input has min=0, max=10, step=0.1', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '0.1');
  });

  it('does NOT render clear override button when override is null', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    expect(
      screen.queryByRole('button', { name: 'Clear override mark for React' }),
    ).not.toBeInTheDocument();
  });

  it('renders clear override button when override is set', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        overrides: { react: 7.5 },
        customQuestions: [],
        setOverride,
      }),
    );
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const clearBtn = screen.getByRole('button', {
      name: 'Clear override mark for React',
    });
    expect(clearBtn).toBeInTheDocument();
  });

  it('clear override button calls setOverride(topicId, null) when clicked', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        overrides: { react: 7.5 },
        customQuestions: [],
        setOverride,
      }),
    );
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const clearBtn = screen.getByRole('button', {
      name: 'Clear override mark for React',
    });
    fireEvent.click(clearBtn);
    expect(setOverride).toHaveBeenCalledWith('react', null);
  });

  it('override input onBlur with valid number calls setOverride with clamped value', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    fireEvent.change(input, { target: { value: '7.5' } });
    fireEvent.blur(input);
    expect(setOverride).toHaveBeenCalledWith('react', 7.5);
  });

  it('override input onBlur with empty string calls setOverride(topicId, null)', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    // Input starts empty; blur with empty value triggers null dispatch
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(setOverride).toHaveBeenCalledWith('react', null);
  });

  it('override input onBlur with value > 10 calls setOverride clamped to 10', () => {
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);
    expect(setOverride).toHaveBeenCalledWith('react', 10);
  });

  it('override input onBlur with empty value (invalid number input cleared by browser) calls setOverride(topicId, null)', () => {
    // type="number" inputs sanitize non-numeric text to '' (browser behavior).
    // The empty string path calls setOverride(topicId, null) which is correct.
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    const input = screen.getByLabelText('Override mark for React');
    // Input is empty by default — blur without change should call setOverride(null)
    fireEvent.blur(input);
    expect(setOverride).toHaveBeenCalledWith('react', null);
  });

  it('displays computed mark as toFixed(1) when questions are scored', () => {
    // Score question 0 (intermediate 1.25x) with 8 → weighted = 10.0, coeffSum = 1.25 → mark = 8.0
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'react-0': 8 },
        overrides: {},
        customQuestions: [],
        setOverride,
      }),
    );
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('computed mark has a band color class', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'react-0': 8 },
        overrides: {},
        customQuestions: [],
        setOverride,
      }),
    );
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    // 8.0 is "high" band → text-emerald-600 dark:text-emerald-400
    const markEl = screen.getByText('8.0');
    expect(markEl.className).toContain('text-emerald-600');
  });

  it('displays override value when override is set', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'react-0': 8 },
        overrides: { react: 5.5 },
        customQuestions: [],
        setOverride,
      }),
    );
    render(<TopicMarkDisplay topicId="react" topic={mockTopic} />);
    expect(screen.getByText('5.5')).toBeInTheDocument();
  });
});
