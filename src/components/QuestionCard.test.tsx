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

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    scores: {},
    notes: {},
    setScore: vi.fn(),
    setNote: vi.fn(),
    deleteCustomQuestion: vi.fn(),
    removeDefaultQuestion: vi.fn(),
    printMode: false,
    hideNotes: false,
    ...overrides,
  };
}

describe('QuestionCard', () => {
  const setScore = vi.fn();
  const setNote = vi.fn();
  const deleteCustomQuestion = vi.fn();
  const removeDefaultQuestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(
        makeState({
          setScore,
          setNote,
          deleteCustomQuestion,
          removeDefaultQuestion,
        }),
      ),
    );
  });

  // Score dropdown tests (SCORE-08)
  it('renders a score select (combobox) with aria-label "{question} score"', () => {
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', {
      name: /What is JSX\? score/,
    });
    expect(select).toBeInTheDocument();
  });

  it('score select shows "Skip" as default selected option when score is null', () => {
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', {
      name: /What is JSX\? score/,
    }) as HTMLSelectElement;
    expect(select.value).toBe('skip');
  });

  it('score select calls setScore with null when "Skip" is selected', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState({ scores: { 'react-q0': 5 }, setScore })),
    );
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', { name: /What is JSX\? score/ });
    fireEvent.change(select, { target: { value: 'skip' } });
    expect(setScore).toHaveBeenCalledWith('react-q0', null);
  });

  it('score select calls setScore with 7 when "7" is selected', () => {
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', { name: /What is JSX\? score/ });
    fireEvent.change(select, { target: { value: '7' } });
    expect(setScore).toHaveBeenCalledWith('react-q0', 7);
  });

  it('score select shows value "8" when score is 8 in store', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(makeState({ scores: { 'react-q0': 8 } })),
    );
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', {
      name: /What is JSX\? score/,
    }) as HTMLSelectElement;
    expect(select.value).toBe('8');
  });

  it('score select has min-w-[52px] class', () => {
    render(<QuestionCard row={mockRow} />);
    const select = screen.getByRole('combobox', { name: /What is JSX\? score/ });
    expect(select.className).toContain('min-w-[52px]');
  });

  it('constructs questionId as topicId-qIndex (V4 format) — select aria-label uses it', () => {
    const row = {
      ...mockRow,
      topicId: 'twig',
      index: 4,
      question: { q: 'What is Twig?', level: 'intermediate' as const },
    };
    render(<QuestionCard row={row} />);
    const select = screen.getByRole('combobox', { name: /What is Twig\? score/ });
    expect(select).toBeInTheDocument();
  });

  // Note icon button tests
  it('renders note icon button with aria-label "Toggle note for {question}"', () => {
    render(<QuestionCard row={mockRow} />);
    const btn = screen.getByRole('button', {
      name: /Toggle note for What is JSX\?/,
    });
    expect(btn).toBeInTheDocument();
  });

  it('note icon button has aria-expanded=false by default', () => {
    render(<QuestionCard row={mockRow} />);
    const btn = screen.getByRole('button', {
      name: /Toggle note for What is JSX\?/,
    });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('note icon button has aria-controls="notes-react-q0"', () => {
    render(<QuestionCard row={mockRow} />);
    const btn = screen.getByRole('button', {
      name: /Toggle note for What is JSX\?/,
    });
    expect(btn).toHaveAttribute('aria-controls', 'notes-react-q0');
  });

  it('note icon button aria-expanded=true after click', () => {
    render(<QuestionCard row={mockRow} />);
    const btn = screen.getByRole('button', {
      name: /Toggle note for What is JSX\?/,
    });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking note icon button shows the textarea', () => {
    render(<QuestionCard row={mockRow} />);
    const btn = screen.getByRole('button', {
      name: /Toggle note for What is JSX\?/,
    });
    fireEvent.click(btn);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea).not.toHaveAttribute('hidden');
  });

  // Notes textarea tests
  it('notes textarea has aria-label "Notes for {question.q}"', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea).toBeInTheDocument();
  });

  it('notes textarea has id notes-{questionId}', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea).toHaveAttribute('id', 'notes-react-q0');
  });

  it('notes textarea has resize-y class', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea.className).toContain('resize-y');
  });

  it('notes textarea has min-h-[64px] class', () => {
    render(<QuestionCard row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for What is JSX?');
    expect(textarea.className).toContain('min-h-[64px]');
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

  // WR-03: default question delete path
  const mockDefaultRow = {
    type: 'question' as const,
    sectionId: 'frontend',
    topicId: 'react',
    question: { q: 'Describe the virtual DOM', level: 'intermediate' as const },
    index: 1,
    isCustom: false,
    isDefaultQuestion: true,
    questionBankId: 'q-react-001',
  };

  it('renders delete button with aria-label "Remove question" for default questions', () => {
    render(<QuestionCard row={mockDefaultRow} />);
    const deleteBtn = screen.getByRole('button', { name: 'Remove question' });
    expect(deleteBtn).toBeInTheDocument();
  });

  it('delete button calls removeDefaultQuestion with questionBankId on click', () => {
    render(<QuestionCard row={mockDefaultRow} />);
    const deleteBtn = screen.getByRole('button', { name: 'Remove question' });
    fireEvent.click(deleteBtn);
    expect(removeDefaultQuestion).toHaveBeenCalledWith('q-react-001');
  });

  it('delete button for default question with undefined questionBankId renders but is a no-op', () => {
    const rowNoId = { ...mockDefaultRow, questionBankId: undefined };
    render(<QuestionCard row={rowNoId as typeof mockDefaultRow} />);
    // The delete button renders (isDefaultQuestion===true triggers button visibility),
    // but clicking it is a no-op because questionBankId is null.
    // The button itself is rendered; verify clicking it does NOT call removeDefaultQuestion.
    const deleteBtn = screen.getByRole('button', { name: 'Remove question' });
    fireEvent.click(deleteBtn);
    expect(removeDefaultQuestion).not.toHaveBeenCalled();
  });
});
