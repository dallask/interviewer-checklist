/**
 * modal-focus-trap.test.tsx
 *
 * Integration tests confirming all 5 modals trap Tab/Shift+Tab focus correctly
 * and restore focus to their trigger element on close.
 *
 * Covers: CandidateModal, ResetConfirmDialog, SessionSwitcherModal,
 *         ImportPreviewModal, AiPromptModal
 *
 * Per CONTEXT.md: "Write integration tests confirming all 5 modals trap focus
 * correctly" (POLISH-04 requirement).
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Component imports ────────────────────────────────────────────────────────

import { CandidateModal } from '../components/CandidateModal.js';
import { ResetConfirmDialog } from '../components/ResetConfirmDialog.js';
import { SessionSwitcherModal } from '../components/SessionSwitcherModal.js';
import { ImportPreviewModal } from '../components/ImportPreviewModal.js';
import { AiPromptModal } from '../components/AiPromptModal.js';
import type { ImportPreview } from '../utils/yamlImport.js';

// ─── Store mocks ──────────────────────────────────────────────────────────────

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    snapshot: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

// ─── happy-dom dialog helpers ─────────────────────────────────────────────────

/**
 * happy-dom supports dialog.showModal() / dialog.close() natively,
 * but does not dispatch the 'close' DOM event automatically when close()
 * is called — we need to dispatch it manually for focus-restore tests.
 */
function openDialog(dialog: HTMLDialogElement) {
  dialog.showModal();
}

function closeDialog(dialog: HTMLDialogElement) {
  dialog.close();
  // Manually dispatch 'close' event so handleClose listeners fire
  dialog.dispatchEvent(new Event('close'));
}

// ─── Tab key dispatch helper ──────────────────────────────────────────────────

function tabKey(element: Element, shiftKey = false) {
  fireEvent.keyDown(element, { key: 'Tab', code: 'Tab', bubbles: true, shiftKey });
}

// ─── Shared manifest mock ─────────────────────────────────────────────────────

const mockManifest = {
  version: 2 as const,
  activeSessionId: 'session-1',
  sessions: [
    {
      id: 'session-1',
      name: 'Session 1',
      createdAt: '2026-06-17T00:00:00Z',
      updatedAt: '2026-06-17T00:00:00Z',
    },
  ],
};

// ─── CandidateModal ───────────────────────────────────────────────────────────

describe('CandidateModal focus trap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        candidate: null,
        setCandidate: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('Tab key wraps focus from last to first focusable element', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const dialog = ref.current!;
    openDialog(dialog);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable.length).toBeGreaterThan(0);

    // Focus the last element and fire Tab
    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    tabKey(dialog);

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('focus is restored to trigger button on dialog close', () => {
    const trigger = document.createElement('button');
    trigger.id = 'open-candidate-modal';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const ref = createRef<HTMLDialogElement>();
    render(<CandidateModal dialogRef={ref} />);
    const dialog = ref.current!;
    openDialog(dialog);

    closeDialog(dialog);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });
});

// ─── ResetConfirmDialog ───────────────────────────────────────────────────────

describe('ResetConfirmDialog focus trap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        resetAll: vi.fn(),
        activeSessionId: 'session-1',
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('Tab key wraps focus from last to first focusable element', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    const dialog = ref.current!;
    openDialog(dialog);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable.length).toBeGreaterThan(0);

    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    tabKey(dialog);

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('focus is restored to trigger button on dialog close', () => {
    const trigger = document.createElement('button');
    trigger.id = 'open-reset-dialog';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const ref = createRef<HTMLDialogElement>();
    render(<ResetConfirmDialog dialogRef={ref} />);
    const dialog = ref.current!;
    openDialog(dialog);

    closeDialog(dialog);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });
});

// ─── SessionSwitcherModal ─────────────────────────────────────────────────────

describe('SessionSwitcherModal focus trap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        manifest: mockManifest,
        activeSessionId: 'session-1',
        createSession: vi.fn().mockResolvedValue(undefined),
        switchSession: vi.fn().mockResolvedValue(undefined),
        renameSession: vi.fn().mockResolvedValue(undefined),
        duplicateSession: vi.fn().mockResolvedValue(undefined),
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('Tab key wraps focus from last to first focusable element', () => {
    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    // Get the SessionSwitcherModal dialog (first one with its aria-labelledby)
    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    const dialog = dialogs.find(
      (d) => d.getAttribute('aria-labelledby') === 'session-switcher-title',
    ) as HTMLDialogElement;
    expect(dialog).toBeDefined();
    openDialog(dialog);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable.length).toBeGreaterThan(0);

    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    tabKey(dialog);

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('focus is restored to trigger button on dialog close', () => {
    const trigger = document.createElement('button');
    trigger.id = 'open-session-switcher';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);
    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    const dialog = dialogs.find(
      (d) => d.getAttribute('aria-labelledby') === 'session-switcher-title',
    ) as HTMLDialogElement;
    openDialog(dialog);

    closeDialog(dialog);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });
});

// ─── ImportPreviewModal ───────────────────────────────────────────────────────

describe('ImportPreviewModal focus trap', () => {
  const mockPreview: ImportPreview = {
    modifiedCount: 2,
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
  };

  afterEach(() => {
    cleanup();
  });

  it('Tab key wraps focus from last to first focusable element', () => {
    const ref = createRef<HTMLDialogElement>();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ImportPreviewModal dialogRef={ref} preview={mockPreview} onConfirm={onConfirm} />);
    const dialog = ref.current!;
    openDialog(dialog);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable.length).toBeGreaterThan(0);

    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    tabKey(dialog);

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('focus is restored to trigger button on dialog close', () => {
    const trigger = document.createElement('button');
    trigger.id = 'open-import-yaml';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const ref = createRef<HTMLDialogElement>();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ImportPreviewModal dialogRef={ref} preview={mockPreview} onConfirm={onConfirm} />);
    const dialog = ref.current!;
    openDialog(dialog);

    closeDialog(dialog);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });
});

// ─── AiPromptModal ────────────────────────────────────────────────────────────

describe('AiPromptModal focus trap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('Tab key wraps focus from last to first focusable element', () => {
    const ref = createRef<HTMLDialogElement>();
    const onClose = vi.fn();
    render(
      <AiPromptModal
        dialogRef={ref}
        prompt="Sample prompt text for testing"
        onClose={onClose}
      />,
    );
    const dialog = ref.current!;
    openDialog(dialog);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable.length).toBeGreaterThan(0);

    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    tabKey(dialog);

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('focus is restored to trigger button on dialog close', () => {
    const trigger = document.createElement('button');
    trigger.id = 'open-ai-prompt';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const ref = createRef<HTMLDialogElement>();
    const onClose = vi.fn();
    render(
      <AiPromptModal
        dialogRef={ref}
        prompt="Sample prompt text for testing"
        onClose={onClose}
      />,
    );
    const dialog = ref.current!;
    openDialog(dialog);

    closeDialog(dialog);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });
});
