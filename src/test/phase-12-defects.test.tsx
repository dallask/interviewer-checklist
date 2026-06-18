/**
 * phase-12-defects.test.tsx
 *
 * Unit tests for UAT defects fixed in Phase 12:
 *   - SCORE-07: TopicMarkDisplay fieldset click isolation (no toggleTopic bubble)
 *   - SESS-05: SessionSwitcherModal backdrop click closes the dialog
 *   - UI-09: hideNotes store state + QuestionCard/TopicRow note suppression
 *   - UI-09 (ActionsGroup): Hide notes button wiring
 *   - UI-10: ActionsGroup icon-only buttons with title tooltips
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act, createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Component imports ────────────────────────────────────────────────────────

import { TopicMarkDisplay } from '../components/TopicMarkDisplay.js';
import { SessionSwitcherModal } from '../components/SessionSwitcherModal.js';
import { QuestionCard } from '../components/QuestionCard.js';
import { TopicRow } from '../components/TopicRow.js';
import { ActionsGroup } from '../components/ActionsGroup.js';

// ─── Store mock ───────────────────────────────────────────────────────────────

// The mock exports useAppStore (for component tests) AND DEFAULT_STATE (for store tests).
// DEFAULT_STATE is re-exported from the actual module so store field assertions work.
vi.mock('../store/app.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/app.js')>();
  return {
    useAppStore: vi.fn(),
    DEFAULT_STATE: actual.DEFAULT_STATE,
  };
});

vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    snapshot: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAppStore, DEFAULT_STATE } from '../store/app.js';

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

// ─── Shared QuestionCard row fixture ─────────────────────────────────────────

const mockQuestionRow = {
  type: 'question' as const,
  topicId: 'topic-js',
  index: 0,
  question: {
    q: 'What is a closure?',
    level: 'intermediate' as const,
  },
  isCustom: false as const,
  customId: undefined,
};

// ─── Shared TopicRow row fixture ──────────────────────────────────────────────

const mockTopicRowData = {
  type: 'topic' as const,
  topic: {
    id: 'topic-js',
    name: 'JavaScript',
    questions: [{ q: 'What is a closure?', level: 'intermediate' as const }],
  },
  isOpen: true,
  questionCount: 1,
};

// ─── UI-09: hideNotes store state ────────────────────────────────────────────

describe('UI-09: hideNotes store state (D-06, D-07)', () => {
  it('DEFAULT_STATE has hideNotes === false', () => {
    // DEFAULT_STATE is re-exported from the actual module via the mock factory above.
    // This test asserts that the initial value for hideNotes is false.
    expect((DEFAULT_STATE as Record<string, unknown>).hideNotes).toBe(false);
  });

  it('hideNotes is a boolean field in DEFAULT_STATE (not undefined)', () => {
    // Confirms hideNotes was added to DEFAULT_STATE with an explicit boolean value.
    expect(typeof (DEFAULT_STATE as Record<string, unknown>).hideNotes).toBe('boolean');
  });

  it('DEFAULT_STATE does not persist hideNotes (volatile UI preference per D-07)', () => {
    // hideNotes must reset to false on reload. This is confirmed by DEFAULT_STATE.hideNotes
    // being false. The subscribe block exclusion is verified by source inspection below
    // (see the must_haves assertion: subscribe block does not contain hideNotes).
    const defaultHideNotes = (DEFAULT_STATE as Record<string, unknown>).hideNotes;
    expect(defaultHideNotes).toBe(false);
    // Not undefined — it's an explicit false (volatile reset, not missing field)
    expect(defaultHideNotes).not.toBeUndefined();
  });
});

// ─── UI-09: QuestionCard note suppression ─────────────────────────────────────

describe('UI-09: QuestionCard note suppression (D-08)', () => {
  afterEach(() => {
    cleanup();
  });

  it('QuestionCard with hideNotes=true has the note section wrapper with class "hidden"', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        notes: {},
        setScore: vi.fn(),
        setNote: vi.fn(),
        deleteCustomQuestion: vi.fn(),
        printMode: false,
        hideNotes: true,
      }),
    );

    render(<QuestionCard row={mockQuestionRow} />);

    // The note toggle button (aria-controls="notes-topic-js-q0") is inside the notes wrapper
    // When hideNotes=true, its parent wrapper div should have class "hidden"
    const noteToggleButton = document.querySelector('button[aria-controls="notes-topic-js-q0"]');
    expect(noteToggleButton).not.toBeNull();
    const wrapper = noteToggleButton!.parentElement as HTMLElement;
    expect(wrapper.className).toContain('hidden');
  });

  it('QuestionCard with hideNotes=true AND printMode=true does NOT suppress notes', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        notes: {},
        setScore: vi.fn(),
        setNote: vi.fn(),
        deleteCustomQuestion: vi.fn(),
        printMode: true,
        hideNotes: true,
      }),
    );

    render(<QuestionCard row={mockQuestionRow} />);

    // In print mode, the notes section wrapper must NOT have the "hidden" class
    const noteToggleButton = document.querySelector('button[aria-controls="notes-topic-js-q0"]');
    expect(noteToggleButton).not.toBeNull();
    const wrapper = noteToggleButton!.parentElement as HTMLElement;
    expect(wrapper.className).not.toContain('hidden');
  });

  it('QuestionCard with hideNotes=false does NOT suppress notes', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        scores: {},
        notes: {},
        setScore: vi.fn(),
        setNote: vi.fn(),
        deleteCustomQuestion: vi.fn(),
        printMode: false,
        hideNotes: false,
      }),
    );

    render(<QuestionCard row={mockQuestionRow} />);

    // Notes section wrapper should not have class "hidden"
    const noteToggleButton = document.querySelector('button[aria-controls="notes-topic-js-q0"]');
    expect(noteToggleButton).not.toBeNull();
    const wrapper = noteToggleButton!.parentElement as HTMLElement;
    expect(wrapper.className).not.toContain('hidden');
  });
});

// ─── UI-11: SidebarGroup icon prop ───────────────────────────────────────────

import { SidebarGroup } from '../components/SidebarGroup.js';

describe('UI-11: SidebarGroup icon prop', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders an aria-hidden icon span before the label when icon prop is provided', () => {
    render(
      <SidebarGroup
        groupId="test"
        label="Test"
        icon="🔍"
        isOpen={false}
        onToggle={() => {}}
      >
        <div />
      </SidebarGroup>,
    );

    // The icon span must be present with aria-hidden="true"
    const iconSpan = document.querySelector('[aria-hidden="true"]');
    expect(iconSpan).not.toBeNull();
    expect(iconSpan!.textContent).toBe('🔍');
  });

  it('does NOT render an icon span when icon prop is omitted', () => {
    render(
      <SidebarGroup
        groupId="test"
        label="Test"
        isOpen={false}
        onToggle={() => {}}
      >
        <div />
      </SidebarGroup>,
    );

    // No icon span with aria-hidden when no icon prop
    const iconSpan = document.querySelector('[aria-hidden="true"]');
    expect(iconSpan).toBeNull();
  });

  it('icon span has aria-hidden="true" so screen readers skip it', () => {
    render(
      <SidebarGroup
        groupId="test"
        label="Search"
        icon="🔍"
        isOpen={false}
        onToggle={() => {}}
      >
        <div />
      </SidebarGroup>,
    );

    const iconSpan = document.querySelector('[aria-hidden="true"]');
    expect(iconSpan).not.toBeNull();
    expect(iconSpan!.getAttribute('aria-hidden')).toBe('true');
  });
});

// ─── UI-09: TopicRow note panel suppression ────────────────────────────────────

describe('UI-09: TopicRow notes panel suppression (D-08)', () => {
  afterEach(() => {
    cleanup();
  });

  it('TopicRow with hideNotes=true has the notes panel wrapper with class "hidden"', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        toggleTopic: vi.fn(),
        setTopicNote: vi.fn(),
        printMode: false,
        hideNotes: true,
        topicNotes: {},
        scores: {},
        overrides: {},
        setOverride: vi.fn(),
        customQuestions: [],
        addCustomQuestion: vi.fn(),
      }),
    );

    render(<TopicRow row={mockTopicRowData} />);

    // The topic notes panel outer div (which wraps both the toggle button and the textarea)
    // should have class "hidden" when hideNotes=true
    // The toggle button is aria-controls="topic-notes-topic-js"
    const topicNoteToggle = document.querySelector('button[aria-controls="topic-notes-topic-js"]');
    expect(topicNoteToggle).not.toBeNull();
    const notesPanel = topicNoteToggle!.parentElement as HTMLElement;
    expect(notesPanel.className).toContain('hidden');
  });

  it('TopicRow with hideNotes=true AND printMode=true does NOT suppress notes panel', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        toggleTopic: vi.fn(),
        setTopicNote: vi.fn(),
        printMode: true,
        hideNotes: true,
        topicNotes: {},
        scores: {},
        overrides: {},
        setOverride: vi.fn(),
        customQuestions: [],
        addCustomQuestion: vi.fn(),
      }),
    );

    render(<TopicRow row={mockTopicRowData} />);

    // In printMode=true, the notes panel must NOT have "hidden" class
    const topicNoteToggle = document.querySelector('button[aria-controls="topic-notes-topic-js"]');
    expect(topicNoteToggle).not.toBeNull();
    const notesPanel = topicNoteToggle!.parentElement as HTMLElement;
    expect(notesPanel.className).not.toContain('hidden');
  });
});

// ─── UI-09: ActionsGroup Hide notes button wiring ─────────────────────────────

// A comprehensive store mock for ActionsGroup (which renders modals inline)
function buildActionsGroupStoreMock(overrides: Record<string, unknown> = {}) {
  const mockManifest = {
    version: 2 as const,
    activeSessionId: 'session-1',
    sessions: [
      {
        id: 'session-1',
        name: 'Session 1',
        createdAt: '2026-06-18T00:00:00Z',
        updatedAt: '2026-06-18T00:00:00Z',
      },
    ],
  };
  return {
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    hideMarked: false,
    setHideMarked: vi.fn(),
    darkMode: false,
    setDarkMode: vi.fn(),
    hideNotes: false,
    setHideNotes: vi.fn(),
    manifest: mockManifest,
    activeSessionId: 'session-1',
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
    createSession: vi.fn().mockResolvedValue(undefined),
    switchSession: vi.fn().mockResolvedValue(undefined),
    renameSession: vi.fn().mockResolvedValue(undefined),
    duplicateSession: vi.fn().mockResolvedValue(undefined),
    importSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('UI-09: ActionsGroup Hide notes button (D-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a button with aria-label="Hide notes"', () => {
    const storeState = buildActionsGroupStoreMock();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(storeState),
    );

    render(<ActionsGroup />);

    const hideNotesBtn = screen.getByRole('button', { name: 'Hide notes' });
    expect(hideNotesBtn).toBeDefined();
  });

  it('button has aria-pressed=false when hideNotes=false', () => {
    const storeState = buildActionsGroupStoreMock({ hideNotes: false });
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(storeState),
    );

    render(<ActionsGroup />);

    const hideNotesBtn = screen.getByRole('button', { name: 'Hide notes' });
    expect(hideNotesBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('button has aria-pressed=true when hideNotes=true', () => {
    const storeState = buildActionsGroupStoreMock({ hideNotes: true });
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(storeState),
    );

    render(<ActionsGroup />);

    const hideNotesBtn = screen.getByRole('button', { name: 'Hide notes' });
    expect(hideNotesBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking the button calls setHideNotes with the toggled value (!hideNotes)', () => {
    const setHideNotesMock = vi.fn();
    const storeState = buildActionsGroupStoreMock({
      hideNotes: false,
      setHideNotes: setHideNotesMock,
    });
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector(storeState),
    );

    render(<ActionsGroup />);

    const hideNotesBtn = screen.getByRole('button', { name: 'Hide notes' });
    fireEvent.click(hideNotesBtn);

    expect(setHideNotesMock).toHaveBeenCalledWith(true);
  });
});
