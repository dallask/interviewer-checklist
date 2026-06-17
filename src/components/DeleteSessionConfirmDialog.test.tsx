import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteSessionConfirmDialog } from './DeleteSessionConfirmDialog.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('DeleteSessionConfirmDialog', () => {
  const deleteSession = vi.fn().mockResolvedValue(undefined);
  const onDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        deleteSession,
      }),
    );
  });

  it('dialog is not open initially', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toBeInTheDocument();
    expect((dialog as HTMLDialogElement).open).toBe(false);
  });

  it('dialog.open === true after showModal()', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);
  });

  it('renders h2 "Delete session?" with aria-labelledby matching', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-session-dialog-title');
    const heading = document.getElementById('delete-session-dialog-title');
    expect(heading).not.toBeNull();
    expect(heading?.tagName).toBe('H2');
    expect(heading?.textContent).toBe('Delete session?');
  });

  it('body text contains the sessionName in quotes', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    // Body text should contain the session name
    expect(screen.getByText(/My Session/)).toBeInTheDocument();
  });

  it('"Keep session" button closes dialog without calling deleteSession', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /keep session/i }));

    expect(deleteSession).not.toHaveBeenCalled();
    expect(ref.current?.open).toBe(false);
  });

  it('"Delete session" button: calls deleteSession(sessionId) then onDeleted()', async () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();

    fireEvent.click(screen.getByRole('button', { name: /delete session/i }));

    await vi.waitFor(() => {
      expect(deleteSession).toHaveBeenCalledWith('session-1');
      expect(onDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it('"Delete session" button: dialog.close() called before deleteSession', async () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /delete session/i }));

    // Dialog should close immediately (before async deleteSession resolves)
    expect(ref.current?.open).toBe(false);

    await vi.waitFor(() => {
      expect(deleteSession).toHaveBeenCalled();
    });
  });

  it('focus restore: after close event, document.getElementById("open-session-switcher")?.focus() called', () => {
    const ref = createRef<HTMLDialogElement>();
    const trigger = document.createElement('button');
    trigger.id = 'open-session-switcher';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    ref.current?.close();
    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });

  it('renders "Keep session" and "Delete session" buttons', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <DeleteSessionConfirmDialog
        dialogRef={ref}
        sessionId="session-1"
        sessionName="My Session"
        onDeleted={onDeleted}
      />,
    );
    ref.current?.showModal();
    expect(screen.getByRole('button', { name: /keep session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete session/i })).toBeInTheDocument();
  });
});
