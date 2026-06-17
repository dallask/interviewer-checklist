import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPromptModal } from './AiPromptModal.js';

// AiPromptModal is purely prop-driven — no store mock needed.

const makeDialogRef = () => ({ current: document.createElement('dialog') });

const SAMPLE_PROMPT = 'Candidate: Alice Smith\nTopic: Twig\n- [8] Q0';

describe('AiPromptModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders prompt in textarea', () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const textarea = screen.getByRole('textbox', { name: /generated ai prompt/i });
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe(SAMPLE_PROMPT);
  });

  it('textarea is editable — firing change event updates displayed value', () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const textarea = screen.getByRole('textbox', { name: /generated ai prompt/i });
    fireEvent.change(textarea, { target: { value: 'Updated prompt text' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Updated prompt text');
  });

  it('copy button calls clipboard.writeText with current textarea content', async () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_PROMPT),
    );
  });

  it('copy button calls writeText with edited content when textarea was changed', async () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const textarea = screen.getByRole('textbox', { name: /generated ai prompt/i });
    fireEvent.change(textarea, { target: { value: 'Modified prompt' } });
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Modified prompt'),
    );
  });

  it('"Copied!" flash appears after successful copy', async () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });

  it('"Copied!" flash disappears after 2 seconds', async () => {
    vi.useFakeTimers();
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
    vi.advanceTimersByTime(2000);
    await vi.waitFor(() => expect(screen.queryByText('Copied!')).not.toBeInTheDocument());
  });

  it('clipboard failure shows fallback text "Select all and copy manually"', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
      writable: true,
    });
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() =>
      expect(screen.getByText('Select all and copy manually')).toBeInTheDocument(),
    );
  });

  it('Close button calls onClose callback', () => {
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('textarea resets when prompt prop changes', () => {
    const dialogRef = makeDialogRef();
    const { rerender } = render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    // Re-render with a different prompt
    rerender(
      <AiPromptModal dialogRef={dialogRef} prompt="New prompt text" onClose={onClose} />,
    );
    const textarea = screen.getByRole('textbox', { name: /generated ai prompt/i });
    expect((textarea as HTMLTextAreaElement).value).toBe('New prompt text');
  });

  it('isPending disables copy button during in-flight write', async () => {
    // Use a never-resolving promise to keep isPending=true
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockReturnValue(new Promise(() => {})) },
      configurable: true,
      writable: true,
    });
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() => expect(copyBtn).toBeDisabled());
  });

  it('isPending disables close button during in-flight write', async () => {
    // Use a never-resolving promise to keep isPending=true
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockReturnValue(new Promise(() => {})) },
      configurable: true,
      writable: true,
    });
    const dialogRef = makeDialogRef();
    render(
      <AiPromptModal dialogRef={dialogRef} prompt={SAMPLE_PROMPT} onClose={onClose} />,
    );
    dialogRef.current.showModal();
    const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(copyBtn);
    await vi.waitFor(() => {
      const closeBtn = screen.getByRole('button', { name: /^close$/i });
      expect(closeBtn).toBeDisabled();
    });
  });
});
