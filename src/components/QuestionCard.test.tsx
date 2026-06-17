import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionCard } from './QuestionCard.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const mockRow = {
  type: 'question' as const,
  sectionId: 'frontend',
  topicId: 'react',
  question: { q: 'What is JSX?', level: 'intermediate' as const },
  index: 0,
  isCustom: false,
};

const mockCustomRow = {
  type: 'question' as const,
  sectionId: 'frontend',
  topicId: 'react',
  question: { q: 'What is your custom question?', level: 'advanced' as const },
  index: 5,
  isCustom: true,
  customId: 'custom-react-1234567890',
};

describe('QuestionCard', () => {
  const setScore = vi.fn();
  const setNote = vi.fn();
  const deleteCustomQuestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        notes: {},
        setScore,
        setNote,
        deleteCustomQuestion,
      }),
    );
  });

  // Slider tests (SCORE-01)
  it('renders a range input with aria-label set to the question text', () => {
    render(<QuestionCard row={mockRow} />);
    const slider = screen.getByRole('slider', { name: 'What is JSX?' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('range input has min=0, max=10, step=1', () => {
    render(<QuestionCard row={mockRow} />);
    const slider = screen.getByRole('slider', { name: 'What is JSX?' });
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('has aria-valuenow=0 when score is null (unscored)', () => {
    render(<QuestionCard row={mockRow} />);
    const slider = screen.getByRole('slider', { name: 'What is JSX?' });
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('has aria-valuemin=0 and aria-valuemax=10', () => {
    render(<QuestionCard row={mockRow} />);
    const slider = screen.getByRole('slider', { name: 'What is JSX?' });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '10');
  });

  it('displays "— / 10" when score is null', () => {
    render(<QuestionCard row={mockRow} />);
    expect(screen.getByText('— / 10')).toBeInTheDocument();
  });

  it('displays "0 / 10" when score is 0', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'react-0': 0 },
        notes: {},
        setScore,
        setNote,
        deleteCustomQuestion,
      }),
    );
    render(<QuestionCard row={mockRow} />);
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });

  it('displays "8 / 10" when score is 8', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'react-0': 8 },
        notes: {},
        setScore,
        setNote,
        deleteCustomQuestion,
      }),
    );
    render(<QuestionCard row={mockRow} />);
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
  });

  it('calls setScore with questionId and numeric value on slider change', () => {
    render(<QuestionCard row={mockRow} />);
    const slider = screen.getByRole('slider', { name: 'What is JSX?' });
    fireEvent.change(slider, { target: { value: '7' } });
    expect(setScore).toHaveBeenCalledWith('react-0', 7);
  });

  it('constructs questionId as topicId-index', () => {
    const row = { ...mockRow, topicId: 'twig', index: 4 };
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: { 'twig-4': 5 },
        notes: {},
        setScore,
        setNote,
        deleteCustomQuestion,
      }),
    );
    render(<QuestionCard row={row} />);
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  // Notes tests (SCORE-03)
  it('renders a notes toggle button with aria-expanded=false by default', () => {
    render(<QuestionCard row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add notes/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('notes toggle button has aria-controls pointing to notes textarea id', () => {
    render(<QuestionCard row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add notes/i });
    expect(toggleBtn).toHaveAttribute('aria-controls', 'notes-react-0');
  });

  it('notes textarea has aria-label "Notes for {question.q}"', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea).toBeInTheDocument();
  });

  it('notes textarea has id notes-{questionId}', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea).toHaveAttribute('id', 'notes-react-0');
  });

  it('notes textarea has resize-y class', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea.className).toContain('resize-y');
  });

  it('notes textarea has min-h-[80px] class', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea.className).toContain('min-h-[80px]');
  });

  it('notes toggle changes label to "Hide notes" when clicked', () => {
    render(<QuestionCard row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add notes/i });
    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole('button', { name: /hide notes/i }),
    ).toBeInTheDocument();
  });

  it('notes toggle button has aria-expanded=true after click', () => {
    render(<QuestionCard row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add notes/i });
    fireEvent.click(toggleBtn);
    const expandedBtn = screen.getByRole('button', { name: /hide notes/i });
    expect(expandedBtn).toHaveAttribute('aria-expanded', 'true');
  });

  // Custom badge and delete button (SCORE-05)
  it('does NOT render "custom" badge for regular questions', () => {
    render(<QuestionCard row={mockRow} />);
    expect(screen.queryByText('custom')).not.toBeInTheDocument();
  });

  it('renders "custom" badge for custom questions', () => {
    render(<QuestionCard row={mockCustomRow} />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('custom badge has correct classes including purple colors', () => {
    render(<QuestionCard row={mockCustomRow} />);
    const badge = screen.getByText('custom');
    expect(badge.className).toContain('bg-purple-100');
    expect(badge.className).toContain('text-purple-700');
    expect(badge.className).toContain('dark:bg-purple-900/30');
    expect(badge.className).toContain('dark:text-purple-400');
  });

  it('does NOT render delete button for regular questions', () => {
    render(<QuestionCard row={mockRow} />);
    expect(
      screen.queryByRole('button', { name: 'Delete custom question' }),
    ).not.toBeInTheDocument();
  });

  it('renders delete button with aria-label "Delete custom question" for custom questions', () => {
    render(<QuestionCard row={mockCustomRow} />);
    const deleteBtn = screen.getByRole('button', {
      name: 'Delete custom question',
    });
    expect(deleteBtn).toBeInTheDocument();
  });

  it('delete button calls deleteCustomQuestion with customId on click', () => {
    render(<QuestionCard row={mockCustomRow} />);
    const deleteBtn = screen.getByRole('button', {
      name: 'Delete custom question',
    });
    fireEvent.click(deleteBtn);
    expect(deleteCustomQuestion).toHaveBeenCalledWith(
      'custom-react-1234567890',
    );
  });
});
