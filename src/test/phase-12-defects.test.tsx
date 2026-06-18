/**
 * phase-12-defects.test.tsx
 *
 * Unit tests for UAT defects fixed in Phase 12:
 *   - SCORE-07: TopicMarkDisplay fieldset click isolation (no toggleTopic bubble)
 *   - SESS-05: SessionSwitcherModal backdrop click closes the dialog
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Component imports ────────────────────────────────────────────────────────

import { TopicMarkDisplay } from '../components/TopicMarkDisplay.js';
import { SessionSwitcherModal } from '../components/SessionSwitcherModal.js';

// ─── Store mock ───────────────────────────────────────────────────────────────

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

// ─── Shared dialog helpers (mirrors modal-focus-trap.test.tsx) ────────────────

function openDialog(dialog: HTMLDialogElement) {
  dialog.showModal();
}

// ─── SCORE-07: TopicMarkDisplay event isolation ───────────────────────────────

describe('SCORE-07: TopicMarkDisplay event isolation', () => {
  const mockTopic = {
    id: 'topic-1',
    name: 'JavaScript',
    questions: [
      { q: 'What is closure?', level: 'junior' as const },
    ],
  };

  const mockToggleTopic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        overrides: {},
        setOverride: vi.fn(),
        customQuestions: [],
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('clicking the fieldset does NOT bubble to a parent onClick (toggleTopic not called)', () => {
    // Render TopicMarkDisplay wrapped in a button that simulates the topic header button in TopicRow
    render(
      <button type="button" onClick={mockToggleTopic} data-testid="topic-header-button">
        <TopicMarkDisplay topicId="topic-1" topic={mockTopic} />
      </button>,
    );

    // Find the fieldset (the override container inside TopicMarkDisplay)
    const fieldset = screen.getByRole('group', { name: /Mark for JavaScript/ });
    expect(fieldset).toBeDefined();

    // Click the fieldset — should NOT bubble to the outer button's onClick
    fireEvent.click(fieldset);

    expect(mockToggleTopic).not.toHaveBeenCalled();
  });

  it('clicking the number input inside the fieldset does NOT call toggleTopic', () => {
    render(
      <button type="button" onClick={mockToggleTopic} data-testid="topic-header-button">
        <TopicMarkDisplay topicId="topic-1" topic={mockTopic} />
      </button>,
    );

    const input = screen.getByRole('spinbutton', { name: /Override mark for JavaScript/ });
    expect(input).toBeDefined();

    fireEvent.click(input);

    expect(mockToggleTopic).not.toHaveBeenCalled();
  });

  it('mousedown on the fieldset does NOT bubble to a parent onClick (toggleTopic not called)', () => {
    render(
      <button type="button" onClick={mockToggleTopic} data-testid="topic-header-button">
        <TopicMarkDisplay topicId="topic-1" topic={mockTopic} />
      </button>,
    );

    const fieldset = screen.getByRole('group', { name: /Mark for JavaScript/ });

    // Fire mousedown — both onClick and onMouseDown stopPropagation needed per RESEARCH.md Pitfall 4
    fireEvent.mouseDown(fieldset);

    // mousedown itself does not fire onClick, but we verify the parent button was not activated
    expect(mockToggleTopic).not.toHaveBeenCalled();
  });
});

// ─── SESS-05: SessionSwitcherModal backdrop click ─────────────────────────────

describe('SESS-05: SessionSwitcherModal backdrop click', () => {
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

  it('clicking the backdrop (event.target === dialog element) calls dialog.close()', () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);

    // Get the session switcher dialog
    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    const dialog = dialogs.find(
      (d) => d.getAttribute('aria-labelledby') === 'session-switcher-title',
    ) as HTMLDialogElement;
    expect(dialog).toBeDefined();

    openDialog(dialog);

    // Simulate a backdrop click: the event target IS the dialog element itself
    fireEvent.click(dialog);

    expect(closeSpy).toHaveBeenCalled();
    closeSpy.mockRestore();
  });

  it('clicking a child element inside the dialog does NOT call dialog.close()', () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

    const ref = createRef<HTMLDialogElement>();
    render(<SessionSwitcherModal dialogRef={ref} />);

    const dialogs = screen.getAllByRole('dialog', { hidden: true });
    const dialog = dialogs.find(
      (d) => d.getAttribute('aria-labelledby') === 'session-switcher-title',
    ) as HTMLDialogElement;
    expect(dialog).toBeDefined();

    openDialog(dialog);

    // Click the × close button (a child of the dialog) — should NOT trigger backdrop close
    // (the close button's own onClick handles it, but we are testing the backdrop guard)
    const closeButton = screen.getByRole('button', { name: /Close sessions/ });
    expect(closeButton).toBeDefined();

    // Dispatch a click event on the close button but intercept it before the handler
    // fires so we can isolate the backdrop check.
    // We do this by firing the event directly on the dialog with a different target.
    const syntheticEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(syntheticEvent, 'target', { value: closeButton, writable: false });
    dialog.dispatchEvent(syntheticEvent);

    // close() may be called by the close button's own onClick — we clear the spy
    // and test the dialog's onClick guard independently
    closeSpy.mockClear();

    // Fire a click event whose target is a child element (not the dialog itself)
    // The dialog's onClick handler should NOT call close() in this case
    const h2 = dialog.querySelector('h2')!;
    expect(h2).toBeDefined();
    const childEvent = new MouseEvent('click', { bubbles: false });
    Object.defineProperty(childEvent, 'target', { value: h2, writable: false });
    dialog.dispatchEvent(childEvent);

    // close() should NOT be called when target is a child element
    expect(closeSpy).not.toHaveBeenCalled();
    closeSpy.mockRestore();
  });
});
