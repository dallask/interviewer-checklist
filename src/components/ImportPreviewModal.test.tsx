import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportPreviewModal } from './ImportPreviewModal.js';
import type { ImportPreview } from '../utils/yamlImport.js';

// ImportPreviewModal is purely prop-driven — no store mock needed.

const makeDialogRef = () => ({
  current: document.createElement('dialog'),
});

const makePreview = (overrides?: Partial<ImportPreview>): ImportPreview => ({
  modifiedCount: 0,
  addedCount: 0,
  unmatchedCount: 0,
  sessionName: 'Test Session',
  result: {
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
    sessionName: 'Test Session',
  },
  ...overrides,
});

describe('ImportPreviewModal', () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Will modify 3 questions" when preview.modifiedCount = 3', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview({ modifiedCount: 3 })}
        onConfirm={onConfirm}
      />,
    );
    // Use hidden: true because dialog content is hidden from accessibility tree when dialog is closed
    expect(screen.getByText(/will modify 3 questions/i)).toBeInTheDocument();
  });

  it('renders "Add 2 custom questions" when preview.addedCount = 2', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview({ addedCount: 2 })}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/add 2 custom questions/i)).toBeInTheDocument();
  });

  it('renders "1 unmatched (skipped)" when preview.unmatchedCount = 1', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview({ unmatchedCount: 1 })}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/1 unmatched \(skipped\)/i)).toBeInTheDocument();
  });

  it('renders session name from preview.sessionName', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview({ sessionName: 'Alice Smith' })}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
  });

  it('toggle defaults to new session (overwriteActive = false)', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview()}
        onConfirm={onConfirm}
      />,
    );
    // Open dialog so accessibility tree exposes buttons
    dialogRef.current.showModal();
    const newSessionBtn = screen.getByRole('button', { name: /import as new session/i });
    expect(newSessionBtn).toHaveAttribute('aria-pressed', 'true');
    const overwriteBtn = screen.getByRole('button', { name: /overwrite active session/i });
    expect(overwriteBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking "Overwrite active session" toggle switches to overwriteActive = true', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview()}
        onConfirm={onConfirm}
      />,
    );
    dialogRef.current.showModal();
    const overwriteBtn = screen.getByRole('button', { name: /overwrite active session/i });
    fireEvent.click(overwriteBtn);
    expect(overwriteBtn).toHaveAttribute('aria-pressed', 'true');
    const newSessionBtn = screen.getByRole('button', { name: /import as new session/i });
    expect(newSessionBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking Import calls onConfirm(false) when in new-session mode', async () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview()}
        onConfirm={onConfirm}
      />,
    );
    dialogRef.current.showModal();
    const confirmBtn = screen.getByRole('button', { name: /^import$/i });
    fireEvent.click(confirmBtn);
    // Allow async handler to settle
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledWith(false));
  });

  it('clicking Import calls onConfirm(true) when in overwrite mode', async () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview()}
        onConfirm={onConfirm}
      />,
    );
    dialogRef.current.showModal();
    // Switch to overwrite mode first
    const overwriteBtn = screen.getByRole('button', { name: /overwrite active session/i });
    fireEvent.click(overwriteBtn);

    const confirmBtn = screen.getByRole('button', { name: /^import$/i });
    fireEvent.click(confirmBtn);
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledWith(true));
  });

  it('clicking Discard import closes dialog without calling onConfirm', () => {
    const dialogRef = makeDialogRef();
    render(
      <ImportPreviewModal
        dialogRef={dialogRef}
        preview={makePreview()}
        onConfirm={onConfirm}
      />,
    );
    // Spy AFTER render so dialogRef.current points to the real rendered dialog element
    const closeSpy = vi.spyOn(dialogRef.current, 'close');
    dialogRef.current.showModal();
    const cancelBtn = screen.getByRole('button', { name: /^discard import$/i });
    fireEvent.click(cancelBtn);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders null-safe — when preview prop is null, modal renders without crashing', () => {
    const dialogRef = makeDialogRef();
    expect(() => {
      render(
        <ImportPreviewModal
          dialogRef={dialogRef}
          preview={null}
          onConfirm={onConfirm}
        />,
      );
    }).not.toThrow();
  });
});
