import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAppStore } from '../store/app.js';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { buildAiPrompt } from '../utils/buildAiPrompt.js';
import {
  buildFilename,
  downloadYaml,
  exportSession,
} from '../utils/yamlExport.js';
import {
  detectFormat,
  MAX_YAML_BYTES,
  parseLegacy,
  parseStructural,
  parseYaml,
  reKeyImportResultToV4,
  type ImportPreview,
} from '../utils/yamlImport.js';
import type { V3Session } from '../storage/types.js';
import { AiPromptModal } from './AiPromptModal.js';
import { CandidateModal } from './CandidateModal.js';
import { ImportPreviewModal } from './ImportPreviewModal.js';
import { ResetConfirmDialog } from './ResetConfirmDialog.js';
import { SessionSwitcherModal } from './SessionSwitcherModal.js';

export function ActionsGroup() {
  const expandAll = useAppStore((s) => s.expandAll);
  const collapseAll = useAppStore((s) => s.collapseAll);
  const hideMarked = useAppStore((s) => s.hideMarked);
  const setHideMarked = useAppStore((s) => s.setHideMarked);
  const hideNotes = useAppStore((s) => s.hideNotes);
  const setHideNotes = useAppStore((s) => s.setHideNotes);
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
  const importDialogRef = useRef<HTMLDialogElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);

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
    const generated = buildAiPrompt(currentSession, DEFAULT_SECTIONS);
    setAiPrompt(generated);
    aiPromptRef.current?.showModal();
  };

  const handleExportYaml = () => {
    const sessionForExport: V3Session = {
      version: 3,
      id: activeSessionId,
      scores,
      overrides,
      notes,
      topicNotes,
      customQuestions,
      candidate,
    };
    const yaml = exportSession(
      sessionForExport,
      activeSessionName,
      DEFAULT_SECTIONS,
    );
    downloadYaml(yaml, buildFilename(activeSessionName));
  };

  const handleOpenImportYaml = () => {
    setImportError(null);
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_YAML_BYTES) {
      setImportError(
        `File too large (${file.size} bytes; max ${MAX_YAML_BYTES})`,
      );
      e.target.value = '';
      return;
    }
    const text = await file.text();
    const parsed = parseYaml(text);
    if (!parsed.ok) {
      setImportError(`Invalid YAML: ${parsed.error}`);
      e.target.value = '';
      return;
    }
    const format = detectFormat(parsed.value);
    const preview =
      format === 'structural'
        ? parseStructural(parsed.value, DEFAULT_SECTIONS)
        : format === 'legacy'
          ? parseLegacy(parsed.value, DEFAULT_SECTIONS)
          : null;
    if (!preview) {
      setImportError('Unrecognized YAML format (missing sections or scores)');
      e.target.value = '';
      return;
    }
    const v4Preview = { ...preview, result: reKeyImportResultToV4(preview.result) };
    setImportPreview(v4Preview);
    importDialogRef.current?.showModal();
    // Allow re-import of the same file
    e.target.value = '';
  };

  const handleImportConfirm = async (overwriteActive: boolean) => {
    if (!importPreview) return;
    await useAppStore
      .getState()
      .importSession(importPreview.result, overwriteActive);
    setImportPreview(null);
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
        aria-pressed={hideNotes}
        onClick={() => setHideNotes(!hideNotes)}
        title="Hide notes"
        aria-label="Hide notes"
        className={`p-2 min-h-[44px] min-w-[44px] text-sm rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${hideNotes ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        📝
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
      <input
        ref={importFileInputRef}
        type="file"
        accept=".yaml,.yml"
        className="hidden"
        onChange={(e) => {
          void handleImportFileChange(e);
        }}
        data-testid="yaml-file-input"
      />
      <button
        type="button"
        id="open-import-yaml"
        onClick={handleOpenImportYaml}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Import YAML
      </button>
      <button
        type="button"
        onClick={handleExportYaml}
        className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        Export YAML
      </button>
      {importError && (
        <p
          role="alert"
          className="text-xs text-red-600 dark:text-red-400 px-1"
          data-testid="yaml-import-error"
        >
          {importError}
        </p>
      )}
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
      <ImportPreviewModal
        dialogRef={importDialogRef}
        preview={importPreview}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
}
