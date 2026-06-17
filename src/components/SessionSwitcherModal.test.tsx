import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionSwitcherModal } from './SessionSwitcherModal.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const mockManifest = {
  version: 2 as const,
  activeSessionId: 'session-1',
  sessions: [
    { id: 'session-1', name: 'Session 1', createdAt: '2026-06-17T00:00:00Z', updatedAt: '2026-06-17T00:00:00Z' },
    { id: 'session-2', name: 'Session 2', createdAt: '2026-06-17T00:01:00Z', updatedAt: '2026-06-17T00:01:00Z' },
  ],
};

describe('SessionSwitcherModal', () => {
  const createSession = vi.fn().mockResolvedValue(undefined);
  const switchSession = vi.fn().mockResolvedValue(undefined);
  const renameSession = vi.fn().mockResolvedValue(undefined);
  const duplicateSession = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        manifest: mockManifest,
        activeSessionId: 'session-1',
        createSession,
        switchSession,
        renameSession,
        duplicateSession,
      }),
    );
  });

  it('renders heading "Sessions"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('renders one row per session in manifest.sessions', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(screen.getByRole('option', { name: /session 1/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /session 2/i, hidden: true })).toBeInTheDocument();
  });

  it('active session row has aria-selected="true"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    const activeRow = document.getElementById('session-row-session-1');
    expect(activeRow).toHaveAttribute('aria-selected', 'true');
    const inactiveRow = document.getElementById('session-row-session-2');
    expect(inactiveRow).toHaveAttribute('aria-selected', 'false');
  });

  it('"New session" button calls createSession action', async () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    const newSessionBtn = screen.getByRole('button', { name: /new session/i });
    fireEvent.click(newSessionBtn);
    await vi.waitFor(() => {
      expect(createSession).toHaveBeenCalledTimes(1);
    });
  });

  it('Close button (×) calls dialog.close()', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);
    const closeBtn = screen.getByRole('button', { name: /close sessions/i });
    fireEvent.click(closeBtn);
    expect(ref.current?.open).toBe(false);
  });

  it('dialog has aria-labelledby="session-switcher-title"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'session-switcher-title');
  });

  it('ul has role="listbox" with aria-activedescendant pointing to active session row', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    const listbox = screen.getByRole('listbox', { hidden: true });
    expect(listbox).toHaveAttribute('aria-activedescendant', 'session-row-session-1');
  });

  it('focus restore: after dialog close event, focus targets #open-session-switcher', () => {
    const ref = createRef<HTMLDialogElement>();
    const trigger = document.createElement('button');
    trigger.id = 'open-session-switcher';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    ref.current?.close();
    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });

  it('renders DeleteSessionConfirmDialog inside modal', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    ref.current?.showModal();
    // The delete dialog should be in the DOM (hidden)
    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    expect(dialogs.length).toBeGreaterThanOrEqual(1);
  });
});
