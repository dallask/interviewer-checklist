import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomQuestionForm } from './CustomQuestionForm.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('CustomQuestionForm', () => {
  const addCustomQuestion = vi.fn();
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        addCustomQuestion,
      }),
    );
  });

  it('renders text input with aria-label "Custom question text"', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByLabelText('Custom question text')).toBeInTheDocument();
  });

  it('text input has placeholder "Enter question…"', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    expect(input).toHaveAttribute('placeholder', 'Enter question…');
  });

  it('renders difficulty select with aria-label "Question difficulty"', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByLabelText('Question difficulty')).toBeInTheDocument();
  });

  it('select has 4 difficulty options', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const select = screen.getByLabelText(
      'Question difficulty',
    ) as HTMLSelectElement;
    expect(select.options).toHaveLength(4);
  });

  it('difficulty select has novice option with correct label', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByText('Beginner (1.00×)')).toBeInTheDocument();
  });

  it('difficulty select has intermediate option with correct label', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByText('Intermediate (1.25×)')).toBeInTheDocument();
  });

  it('difficulty select has advanced option with correct label', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByText('Advanced (1.50×)')).toBeInTheDocument();
  });

  it('difficulty select has expert option with correct label', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(screen.getByText('Expert (1.75×)')).toBeInTheDocument();
  });

  it('default selected difficulty is "intermediate"', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const select = screen.getByLabelText(
      'Question difficulty',
    ) as HTMLSelectElement;
    expect(select.value).toBe('intermediate');
  });

  it('renders "Add question" submit button', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(
      screen.getByRole('button', { name: /add question/i }),
    ).toBeInTheDocument();
  });

  it('renders "Discard question" cancel button', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    expect(
      screen.getByRole('button', { name: /discard question/i }),
    ).toBeInTheDocument();
  });

  it('submitting with valid text calls addCustomQuestion with correct shape', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    fireEvent.change(input, { target: { value: 'My custom question' } });
    const submitBtn = screen.getByRole('button', { name: /add question/i });
    fireEvent.click(submitBtn);
    expect(addCustomQuestion).toHaveBeenCalledTimes(1);
    const call = addCustomQuestion.mock.calls[0][0];
    expect(call).toMatchObject({
      topicId: 'react',
      text: 'My custom question',
      level: 'intermediate',
    });
    expect(call.id).toMatch(/^custom-react-\d+$/);
  });

  it('submitting with valid text calls onDismiss', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    fireEvent.change(input, { target: { value: 'My question' } });
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('submitting with empty text does NOT call addCustomQuestion', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const submitBtn = screen.getByRole('button', { name: /add question/i });
    fireEvent.click(submitBtn);
    expect(addCustomQuestion).not.toHaveBeenCalled();
  });

  it('submitting with whitespace-only text does NOT call addCustomQuestion', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(addCustomQuestion).not.toHaveBeenCalled();
  });

  it('submitting with empty text does NOT call onDismiss', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('discard button calls onDismiss without dispatching addCustomQuestion', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    fireEvent.change(input, { target: { value: 'Some question' } });
    fireEvent.click(screen.getByRole('button', { name: /discard question/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(addCustomQuestion).not.toHaveBeenCalled();
  });

  it('submitted custom question uses selected difficulty level', () => {
    render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
    const input = screen.getByLabelText('Custom question text');
    fireEvent.change(input, { target: { value: 'Expert question' } });
    const select = screen.getByLabelText('Question difficulty');
    fireEvent.change(select, { target: { value: 'expert' } });
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    expect(addCustomQuestion.mock.calls[0][0]).toMatchObject({
      level: 'expert',
    });
  });
});
