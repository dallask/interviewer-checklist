import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UndoToast } from './UndoToast.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const mockUndoBuffer = {
  sessionMeta: {
    id: 'session-1',
    name: 'Session 1',
    createdAt: '2026-06-17T00:00:00Z',
    updatedAt: '2026-06-17T00:00:00Z',
  },
  sessionData: {} as never,
  wasActive: true,
};

describe('UndoToast', () => {
  const undoDeleteSession = vi.fn().mockResolvedValue(undefined);
  const setUndoBuffer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when undoBuffer is null', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: null,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    const { container } = render(<UndoToast />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when undoBuffer is non-null; shows session name in message', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: mockUndoBuffer,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    render(<UndoToast />);
    expect(screen.getByText(/Session 1/)).toBeInTheDocument();
  });

  it('"Undo" button click calls undoDeleteSession()', async () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: mockUndoBuffer,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    render(<UndoToast />);
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    await vi.waitFor(() => {
      expect(undoDeleteSession).toHaveBeenCalledTimes(1);
    });
  });

  it('× dismiss button click calls setUndoBuffer(null)', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: mockUndoBuffer,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    render(<UndoToast />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(setUndoBuffer).toHaveBeenCalledWith(null);
  });

  it('has role="status" aria-live="polite" aria-atomic="true"', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: mockUndoBuffer,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    render(<UndoToast />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('has className containing "fixed bottom-0"', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        undoBuffer: mockUndoBuffer,
        undoDeleteSession,
        setUndoBuffer,
      }),
    );
    render(<UndoToast />);
    const toast = screen.getByRole('status');
    expect(toast.className).toContain('fixed');
    expect(toast.className).toContain('bottom-0');
  });
});
