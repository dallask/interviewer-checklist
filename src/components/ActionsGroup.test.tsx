import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionsGroup } from './ActionsGroup.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('./SessionSwitcherModal.js', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SessionSwitcherModal: ({ dialogRef }: { dialogRef: any }) => (
    <dialog ref={dialogRef} data-testid="session-switcher-modal" />
  ),
}));

vi.mock('./ImportPreviewModal.js', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ImportPreviewModal: ({ dialogRef }: { dialogRef: any }) => (
    <dialog ref={dialogRef} data-testid="import-preview-modal" />
  ),
}));

import { useAppStore } from '../store/app.js';

const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

const SESSION_ID = 'session-1';
const MANIFEST = {
  version: 2 as const,
  activeSessionId: SESSION_ID,
  sessions: [{ id: SESSION_ID, name: 'Session 1', createdAt: '', updatedAt: '' }],
};

describe('ActionsGroup', () => {
  const expandAll = vi.fn();
  const collapseAll = vi.fn();
  const setHideMarked = vi.fn();
  const setDarkMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: false,
        setDarkMode,
        manifest: MANIFEST,
        activeSessionId: SESSION_ID,
        scores: {},
        overrides: {},
        notes: {},
        topicNotes: {},
        customQuestions: [],
        candidate: null,
        resetAll: vi.fn(),
        setCandidate: vi.fn(),
      }),
    );
  });

  it('renders Expand all button that calls expandAll', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /expand all/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(expandAll).toHaveBeenCalledTimes(1);
  });

  it('renders Collapse all button that calls collapseAll', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /collapse all/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(collapseAll).toHaveBeenCalledTimes(1);
  });

  it('Hide marked topics button has aria-pressed reflecting hideMarked state', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /hide marked topics/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('dark mode toggle shows "Dark mode" when darkMode=false', () => {
    render(<ActionsGroup />);
    expect(
      screen.getByRole('button', { name: /dark mode/i }),
    ).toBeInTheDocument();
  });

  it('dark mode toggle shows "Light mode" when darkMode=true', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: true,
        setDarkMode,
        manifest: MANIFEST,
        activeSessionId: SESSION_ID,
        scores: {},
        overrides: {},
        notes: {},
        topicNotes: {},
        customQuestions: [],
        candidate: null,
        resetAll: vi.fn(),
        setCandidate: vi.fn(),
      }),
    );
    render(<ActionsGroup />);
    expect(
      screen.getByRole('button', { name: /light mode/i }),
    ).toBeInTheDocument();
  });

  it('dark mode toggle button has aria-pressed reflecting darkMode', () => {
    render(<ActionsGroup />);
    const darkBtn = screen.getByRole('button', { name: /dark mode/i });
    expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('dark mode toggle button has aria-pressed="true" when darkMode=true', () => {
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({
        expandAll,
        collapseAll,
        hideMarked: false,
        setHideMarked,
        darkMode: true,
        setDarkMode,
        manifest: MANIFEST,
        activeSessionId: SESSION_ID,
        scores: {},
        overrides: {},
        notes: {},
        topicNotes: {},
        customQuestions: [],
        candidate: null,
        resetAll: vi.fn(),
        setCandidate: vi.fn(),
      }),
    );
    render(<ActionsGroup />);
    const lightBtn = screen.getByRole('button', { name: /light mode/i });
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking dark mode toggle calls setDarkMode with toggled value', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /dark mode/i });
    fireEvent.click(btn);
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });

  it('ActionsGroup own buttons have focus-visible ring classes', () => {
    render(<ActionsGroup />);
    const ownButtonNames = [
      /switch session/i,
      /ai feedback prompt/i,
      /expand all/i,
      /collapse all/i,
      /hide marked topics/i,
      /dark mode/i,
      /candidate details/i,
      /import yaml/i,
      /export yaml/i,
      /reset all/i,
    ];
    for (const name of ownButtonNames) {
      const btn = screen.getByRole('button', { name });
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-blue-500');
    }
  });

  it('renders "Candidate details" button with id="open-candidate-modal"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /candidate details/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-candidate-modal');
  });

  it('"Candidate details" button has correct styling classes', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /candidate details/i });
    expect(btn.className).toContain('text-gray-900');
    expect(btn.className).toContain('bg-gray-100');
  });

  it('renders "Reset all" button with id="open-reset-dialog"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /reset all/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-reset-dialog');
  });

  it('"Reset all" button has text-red-600 class', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /reset all/i });
    expect(btn.className).toContain('text-red-600');
  });

  it('renders "AI feedback prompt" button with id="open-ai-prompt"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /ai feedback prompt/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-ai-prompt');
  });

  it('renders "Import YAML" button with id="open-import-yaml"', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /import yaml/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('id', 'open-import-yaml');
  });

  it('renders "Export YAML" button', () => {
    render(<ActionsGroup />);
    const btn = screen.getByRole('button', { name: /export yaml/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders hidden YAML file input', () => {
    render(<ActionsGroup />);
    const input = screen.getByTestId('yaml-file-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', '.yaml,.yml');
  });

  it('mounts ImportPreviewModal', () => {
    render(<ActionsGroup />);
    expect(screen.getByTestId('import-preview-modal')).toBeInTheDocument();
  });

  it('clicking "AI feedback prompt" calls showModal() on the AI prompt dialog', () => {
    render(<ActionsGroup />);
    const dialog = document.querySelector(
      'dialog[aria-labelledby="ai-prompt-title"]',
    ) as HTMLDialogElement;
    const showModal = vi.fn();
    Object.defineProperty(dialog, 'showModal', { value: showModal, writable: true });
    fireEvent.click(screen.getByRole('button', { name: /ai feedback prompt/i }));
    expect(showModal).toHaveBeenCalledTimes(1);
  });

  describe('Session switcher', () => {
    it('renders active session name label with aria-label="Active session"', () => {
      render(<ActionsGroup />);
      const label = screen.getByLabelText('Active session');
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe('Session 1');
    });

    it('renders "Switch session" button with id="open-session-switcher"', () => {
      render(<ActionsGroup />);
      const btn = screen.getByRole('button', { name: /switch session/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('id', 'open-session-switcher');
    });

    it('clicking "Switch session" calls showModal() on the session switcher dialog ref', () => {
      render(<ActionsGroup />);
      const dialog = screen.getByTestId('session-switcher-modal') as HTMLDialogElement;
      const showModal = vi.fn();
      Object.defineProperty(dialog, 'showModal', { value: showModal, writable: true });
      const btn = screen.getByRole('button', { name: /switch session/i });
      fireEvent.click(btn);
      expect(showModal).toHaveBeenCalledTimes(1);
    });
  });
});
