import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { CandidateModal } from './CandidateModal.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('CandidateModal', () => {
  const setCandidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        candidate: null,
        setCandidate,
      }),
    );
  });

  it('dialog is not open initially (no showModal called)', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toBeInTheDocument();
    // dialog.open should be false when showModal() has NOT been called
    expect((dialog as HTMLDialogElement).open).toBe(false);
  });

  it('dialog.open === true after showModal() is called', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);
  });

  it('has aria-labelledby="candidate-modal-title"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'candidate-modal-title');
  });

  it('h2 has id="candidate-modal-title"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const heading = document.getElementById('candidate-modal-title');
    expect(heading).not.toBeNull();
    expect(heading?.tagName).toBe('H2');
  });

  it('renders all 6 field inputs', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Interviewer')).toBeInTheDocument();
    expect(screen.getByLabelText('Details')).toBeInTheDocument();
  });

  it('Save details button dispatches setCandidate with all 6 fields', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    ref.current?.showModal();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Engineer' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-17' } });
    fireEvent.change(screen.getByLabelText('Interviewer'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Details'), { target: { value: 'Great candidate' } });

    fireEvent.click(screen.getByRole('button', { name: /save details/i }));

    expect(setCandidate).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      role: 'Engineer',
      date: '2026-06-17',
      interviewer: 'Bob',
      details: 'Great candidate',
    });
  });

  it('Discard changes button does not dispatch setCandidate', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    ref.current?.showModal();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(setCandidate).not.toHaveBeenCalled();
  });

  it('Reset details clears all fields and dispatches setCandidate(null)', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    ref.current?.showModal();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /reset details/i }));

    expect(setCandidate).toHaveBeenCalledWith(null);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
  });

  it('pre-populates fields from store.candidate when candidate is set', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        candidate: {
          name: 'Jane',
          email: 'jane@example.com',
          role: 'Designer',
          date: '2026-01-01',
          interviewer: 'Carol',
          details: 'Creative',
        },
        setCandidate,
      }),
    );
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Jane');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('jane@example.com');
    expect((screen.getByLabelText('Role') as HTMLInputElement).value).toBe('Designer');
    expect((screen.getByLabelText('Interviewer') as HTMLInputElement).value).toBe('Carol');
    expect((screen.getByLabelText('Details') as HTMLTextAreaElement).value).toBe('Creative');
  });

  it('Save details renders a button with type="submit"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const saveBtn = screen.getByRole('button', { name: /save details/i });
    expect(saveBtn).toHaveAttribute('type', 'submit');
  });
});
