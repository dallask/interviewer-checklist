import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { ResetConfirmDialog } from './ResetConfirmDialog.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    snapshot: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAppStore } from '../store/app.js';
import { storageAdapter } from '../storage/index.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;
const mockSnapshot = storageAdapter.snapshot as ReturnType<typeof vi.fn>;

describe('ResetConfirmDialog', () => {
  const resetAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        resetAll,
        activeSessionId: 'session-1',
      }),
    );
  });

  it('dialog is not open initially', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toBeInTheDocument();
    expect((dialog as HTMLDialogElement).open).toBe(false);
  });

  it('dialog.open === true after showModal()', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);
  });

  it('has aria-labelledby="reset-dialog-title"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'reset-dialog-title');
  });

  it('h2 has id="reset-dialog-title"', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    const heading = document.getElementById('reset-dialog-title');
    expect(heading).not.toBeNull();
    expect(heading?.tagName).toBe('H2');
  });

  it('Keep scores button closes dialog without calling resetAll', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    ref.current?.showModal();
    expect(ref.current?.open).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /keep scores/i }));

    expect(resetAll).not.toHaveBeenCalled();
    expect(ref.current?.open).toBe(false);
  });

  it('Reset button calls storageAdapter.snapshot then resetAll', async () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    ref.current?.showModal();

    fireEvent.click(screen.getByRole('button', { name: /^reset$/i }));

    // Wait for the async handler
    await vi.waitFor(() => {
      expect(mockSnapshot).toHaveBeenCalledWith('session-1');
      expect(resetAll).toHaveBeenCalledTimes(1);
    });

    // snapshot must be called before resetAll
    const snapshotOrder = mockSnapshot.mock.invocationCallOrder[0];
    const resetOrder = resetAll.mock.invocationCallOrder[0];
    expect(snapshotOrder).toBeLessThan(resetOrder);
  });

  it('renders Keep scores and Reset buttons', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    expect(screen.getByRole('button', { name: /keep scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeInTheDocument();
  });
});
