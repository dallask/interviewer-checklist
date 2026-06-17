import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopicRow } from './TopicRow.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('./TopicMarkDisplay.js', () => ({
  TopicMarkDisplay: ({
    topicId,
    topic,
  }: {
    topicId: string;
    topic: { name: string };
  }) => (
    <div data-testid="topic-mark-display" data-topic-id={topicId}>
      Mark for {topic.name}
    </div>
  ),
}));

vi.mock('./CustomQuestionForm.js', () => ({
  CustomQuestionForm: ({
    topicId,
    onDismiss,
  }: {
    topicId: string;
    onDismiss: () => void;
  }) => (
    <div data-testid="custom-question-form" data-topic-id={topicId}>
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  ),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const mockRow = {
  type: 'topic' as const,
  sectionId: 'frontend',
  topic: {
    id: 'react',
    name: 'React',
    desc: 'React fundamentals',
    tag: 'react',
    questions: [
      { q: 'What is JSX?', level: 'intermediate' as const },
      { q: 'What are hooks?', level: 'advanced' as const },
    ],
  },
  questionCount: 2,
  isOpen: true,
};

describe('TopicRow', () => {
  const toggleTopic = vi.fn();
  const setTopicNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        toggleTopic,
        topicNotes: {},
        setTopicNote,
      }),
    );
  });

  it('renders topic name', () => {
    render(<TopicRow row={mockRow} />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders TopicMarkDisplay instead of "—" stub', () => {
    render(<TopicRow row={mockRow} />);
    expect(screen.getByTestId('topic-mark-display')).toBeInTheDocument();
    // The old "—" stub should NOT be a standalone element
    // (TopicMarkDisplay mock renders "Mark for React", not "—")
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('TopicMarkDisplay receives correct topicId and topic', () => {
    render(<TopicRow row={mockRow} />);
    const display = screen.getByTestId('topic-mark-display');
    expect(display).toHaveAttribute('data-topic-id', 'react');
  });

  it('renders topic notes toggle button with aria-expanded=false by default', () => {
    render(<TopicRow row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add topic notes/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('topic notes toggle button has aria-controls "topic-notes-{topicId}"', () => {
    render(<TopicRow row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add topic notes/i });
    expect(toggleBtn).toHaveAttribute('aria-controls', 'topic-notes-react');
  });

  it('topic notes textarea has id "topic-notes-{topicId}"', () => {
    render(<TopicRow row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for React');
    expect(textarea).toHaveAttribute('id', 'topic-notes-react');
  });

  it('topic notes textarea has resize-y and min-h-[80px]', () => {
    render(<TopicRow row={mockRow} />);
    const textarea = screen.getByLabelText('Notes for React');
    expect(textarea.className).toContain('resize-y');
    expect(textarea.className).toContain('min-h-[80px]');
  });

  it('topic notes toggle changes label to "Hide topic notes" when clicked', () => {
    render(<TopicRow row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add topic notes/i });
    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole('button', { name: /hide topic notes/i }),
    ).toBeInTheDocument();
  });

  it('topic notes toggle has aria-expanded=true after click', () => {
    render(<TopicRow row={mockRow} />);
    const toggleBtn = screen.getByRole('button', { name: /add topic notes/i });
    fireEvent.click(toggleBtn);
    const expandedBtn = screen.getByRole('button', {
      name: /hide topic notes/i,
    });
    expect(expandedBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders "+ Add question" trigger button', () => {
    render(<TopicRow row={mockRow} />);
    expect(
      screen.getByRole('button', { name: /\+ add question/i }),
    ).toBeInTheDocument();
  });

  it('clicking "+ Add question" shows CustomQuestionForm', () => {
    render(<TopicRow row={mockRow} />);
    const addBtn = screen.getByRole('button', { name: /\+ add question/i });
    fireEvent.click(addBtn);
    expect(screen.getByTestId('custom-question-form')).toBeInTheDocument();
  });

  it('CustomQuestionForm receives topicId', () => {
    render(<TopicRow row={mockRow} />);
    const addBtn = screen.getByRole('button', { name: /\+ add question/i });
    fireEvent.click(addBtn);
    const form = screen.getByTestId('custom-question-form');
    expect(form).toHaveAttribute('data-topic-id', 'react');
  });

  it('CustomQuestionForm dismisses when onDismiss is called', () => {
    render(<TopicRow row={mockRow} />);
    const addBtn = screen.getByRole('button', { name: /\+ add question/i });
    fireEvent.click(addBtn);
    expect(screen.getByTestId('custom-question-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(
      screen.queryByTestId('custom-question-form'),
    ).not.toBeInTheDocument();
  });
});
