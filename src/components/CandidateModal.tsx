import { type RefObject, useEffect, useState } from 'react';
import type { CandidateDetails } from '../store/app.js';
import { useAppStore } from '../store/app.js';

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function CandidateModal({ dialogRef }: Props) {
  const candidate = useAppStore((s) => s.candidate);
  const setCandidate = useAppStore((s) => s.setCandidate);

  const [name, setName] = useState(candidate?.name ?? '');
  const [email, setEmail] = useState(candidate?.email ?? '');
  const [role, setRole] = useState(candidate?.role ?? '');
  const [date, setDate] = useState(candidate?.date ?? '');
  const [interviewer, setInterviewer] = useState(candidate?.interviewer ?? '');
  const [details, setDetails] = useState(candidate?.details ?? '');

  // Pre-populate fields when store candidate changes
  useEffect(() => {
    setName(candidate?.name ?? '');
    setEmail(candidate?.email ?? '');
    setRole(candidate?.role ?? '');
    setDate(candidate?.date ?? '');
    setInterviewer(candidate?.interviewer ?? '');
    setDetails(candidate?.details ?? '');
  }, [candidate]);

  // Focus trap: query focusable elements inside handler each time (for dynamic state safety)
  useEffect(() => {
    const maybeDialog = dialogRef.current;
    if (!maybeDialog) return;
    // Assign to const with non-null type so TypeScript preserves narrowing in closures
    const dialogEl: HTMLDialogElement = maybeDialog;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      // WR-02: guard against empty focusable list to prevent TypeError on .focus()
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function handleClose() {
      document.getElementById('open-candidate-modal')?.focus();
    }

    dialogEl.addEventListener('keydown', handleKeyDown);
    dialogEl.addEventListener('close', handleClose);
    return () => {
      dialogEl.removeEventListener('keydown', handleKeyDown);
      dialogEl.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const candidateDetails: CandidateDetails = {
      name,
      email,
      role,
      date,
      interviewer,
      details,
    };
    setCandidate(candidateDetails);
    dialogRef.current?.close();
  }

  function handleDiscard() {
    dialogRef.current?.close();
  }

  function handleResetDetails() {
    setName('');
    setEmail('');
    setRole('');
    setDate('');
    setInterviewer('');
    setDetails('');
    setCandidate(null);
  }

  const inputClass =
    'text-[13px] font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none';

  return (
    // T-05-03-04: Never pass open prop — always call .showModal() imperatively
    <dialog
      ref={dialogRef}
      aria-labelledby="candidate-modal-title"
      className="fixed inset-0 m-auto w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2
        id="candidate-modal-title"
        className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4"
      >
        Candidate Details
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-name"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Name
          </label>
          <input
            id="candidate-name"
            type="text"
            name="name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-email"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            id="candidate-email"
            type="email"
            name="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-role"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Role
          </label>
          <input
            id="candidate-role"
            type="text"
            name="role"
            autoComplete="off"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-date"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Date
          </label>
          <input
            id="candidate-date"
            type="date"
            name="date"
            autoComplete="off"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-interviewer"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Interviewer
          </label>
          <input
            id="candidate-interviewer"
            type="text"
            name="interviewer"
            autoComplete="off"
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="candidate-details"
            className="text-[13px] font-normal text-gray-700 dark:text-gray-300"
          >
            Details
          </label>
          <textarea
            id="candidate-details"
            name="details"
            autoComplete="off"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Note candidate details…"
            className="resize-y min-h-[80px] text-[13px] font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            aria-label="Reset candidate details"
            onClick={handleResetDetails}
            className="text-[13px] font-normal text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Reset details
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="text-[13px] font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Discard changes
            </button>
            <button
              type="submit"
              className="text-[13px] font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Save details
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
