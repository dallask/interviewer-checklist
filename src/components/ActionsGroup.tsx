import { useRef, useState } from 'react';
import { useAppStore } from '../store/app.js';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildAiPrompt } from '../utils/buildAiPrompt.js';
import { AiPromptModal } from './AiPromptModal.js';
import { CandidateModal } from './CandidateModal.js';
import { ResetConfirmDialog } from './ResetConfirmDialog.js';
import { SessionSwitcherModal } from './SessionSwitcherModal.js';

export function ActionsGroup() {
  const expandAll = useAppStore((s) => s.expandAll);
  const collapseAll = useAppStore((s) => s.collapseAll);
  const hideMarked = useAppStore((s) => s.hideMarked);
  const setHideMarked = useAppStore((s) => s.setHideMarked);
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const manifest = useAppStore((s) => s.manifest);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const scores = useAppStore((s) => s.scores);
  const overrides = useAppStore((s) => s.overrides);
  const notes = useAppStore((s) => s.notes);
  const topicNotes = useAppStore((s) => s.topicNotes);
  const customQuestions = useAppStore((s) => s.customQuestions);
  const candidate = useAppStore((s) => s.candidate);

  const candidateDialogRef = useRef<HTMLDialogElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const sessionSwitcherRef = useRef<HTMLDialogElement>(null);
  const aiPromptRef = useRef<HTMLDialogElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');

  const activeSessionName =
    manifest?.sessions.find((s) => s.id === activeSessionId)?.name ?? '';

  const handleOpenAiPrompt = () => {
    const currentSession = {
      scores,
      overrides,
      notes,
      topicNotes,
      customQuestions,
      candidate,
    };
    const generated = buildAiPrompt(currentSession as unknown as V3Session, DEFAULT_SECTIONS);
    setAiPrompt(generated);
    aiPromptRef.current?.showModal();
  };

  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-normal text-gray-500 dark:text-gray-400 px-1 truncate"
        aria-label="Active session"
      >
        {activeSessionName}
      </p>
      <button
        type="button"
        id="open-session-switcher"
        onClick={() => sessionSwitcherRef.current?.showModal()}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Switch session
      </button>
      <button
        type="button"
        id="open-ai-prompt"
        onClick={handleOpenAiPrompt}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        AI feedback prompt
      </button>
      <hr className="border-gray-200 dark:border-gray-700 my-1" />
      <button
        type="button"
        onClick={expandAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Expand all
      </button>
      <button
        type="button"
        onClick={collapseAll}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Collapse all
      </button>
      <button
        type="button"
        aria-pressed={hideMarked}
        onClick={() => setHideMarked(!hideMarked)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Hide marked topics
      </button>
      <button
        type="button"
        aria-pressed={darkMode}
        onClick={() => setDarkMode(!darkMode)}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        {darkMode ? 'Light mode' : 'Dark mode'}
      </button>
      <button
        type="button"
        id="open-candidate-modal"
        onClick={() => candidateDialogRef.current?.showModal()}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Candidate details
      </button>
      <button
        type="button"
        id="open-reset-dialog"
        onClick={() => resetDialogRef.current?.showModal()}
        className="w-full text-sm px-3 py-2 text-left text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Reset all
      </button>
      <SessionSwitcherModal dialogRef={sessionSwitcherRef} />
      <CandidateModal dialogRef={candidateDialogRef} />
      <ResetConfirmDialog dialogRef={resetDialogRef} />
      <AiPromptModal
        dialogRef={aiPromptRef}
        prompt={aiPrompt}
        onClose={() => { aiPromptRef.current?.close(); }}
      />
    </div>
  );
}
