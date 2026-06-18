---
phase: 09-polish-print-keyboard-a11y-welcome-updates
plan: 03
status: complete
completed: 2026-06-18
requirements: [POLISH-01, POLISH-05]
key_files:
  created:
    - src/app/welcome.html
    - src/app/welcome-main.tsx
    - src/app/Welcome.tsx
  modified:
    - vite.config.ts
    - src/app/main.tsx
    - src/components/QuestionCard.tsx
    - src/components/TopicRow.tsx
    - src/components/ContentTree.tsx
metrics:
  tasks: 2
  commits: 2
  tests_passing: 510
  build: green
---

# Phase 9 Plan 03: Welcome page + remaining print CSS — Summary

POLISH-01 first-run welcome page implemented as a standalone Vite/React
entry (`src/app/welcome.html`), and POLISH-05 print CSS finished on
`QuestionCard`, `TopicRow`, and `ContentTree`. `npm run build` succeeds
with the second `rollupOptions.input` entry — CRXJS 2.6.1 + Vite 8 do
not exhibit the issue-#876 regression flagged in 09-RESEARCH.md
Assumption A1, so the public-folder fallback was not needed.

## What was built

### Task 1 — Welcome page + Vite entry (commit `8949fc9`)

- **`src/app/welcome.html`** — second Vite HTML entry, mirrors `app.html`
  exactly: `theme.ts` script tag for dark-mode FOUC prevention, then
  `welcome-main.tsx` as the module entry.
- **`src/app/welcome-main.tsx`** — `StrictMode` + `createRoot` mount of
  `<Welcome />`, imports `./styles.css` for Tailwind base. No
  `bootstrap()` / `storageAdapter` / `useAppStore` plumbing — the
  welcome page is read-only and standalone.
- **`src/app/Welcome.tsx`** — implements UI-SPEC section 1 verbatim:
  skip link, `<main id="main-content">` with `max-w-2xl mx-auto px-6
  py-16`, page title, subtitle, `v{version}` from
  `chrome.runtime.getManifest()`, "Pin to your toolbar" section, two
  audience cards in a `grid grid-cols-1 md:grid-cols-2 gap-6` layout,
  and two CTA buttons. `useEffect` on mount writes
  `chrome.storage.local.set({ hasSeenWelcome: true })`. Primary CTA
  opens `src/app/app.html` via `chrome.runtime.getURL` +
  `chrome.tabs.create`. Secondary CTA writes
  `activeSessionOverride: 'demo'` to storage before opening the main
  tab so `main.tsx` can switch to the demo session at bootstrap.
- **`vite.config.ts`** — added `'src/app/welcome': 'src/app/welcome.html'`
  to `build.rollupOptions.input`; no other key touched.
- **`src/app/main.tsx`** — after bootstrap and store hydration, reads
  `activeSessionOverride` from `chrome.storage.local`; if present and
  different from the bootstrapped active session, calls
  `useAppStore.getState().switchSession(...)` and then
  `chrome.storage.local.remove('activeSessionOverride')` so the
  override is a one-shot signal. Wrapped in try/catch so any chrome
  API hiccup is logged but non-fatal — the app still renders.

### Task 2 — Print CSS on QuestionCard, TopicRow, ContentTree (commit `8c6ab0c`)

- **`src/components/QuestionCard.tsx`**
  - `print:hidden` on the score slider row, the "Add notes" / "Hide
    notes" toggle button, and the custom-question delete button.
  - Added a print-only readout (`hidden print:block`) that shows
    "Score: N / 10" once the slider row is hidden so the printed page
    still carries the captured score.
  - Subscribes to `printMode` from `useAppStore` (the field added in
    Plan 09-02's store changes).
  - Notes textarea: `hidden={!notesOpen && !localNote && !printMode}`
    so textareas with content (or when `usePrintExpansion`'s
    `beforeprint` handler from Plan 09-02 sets `printMode = true`)
    render without the HTML `hidden` attribute and pick up the
    print-only `print:h-auto print:overflow-visible print:resize-none
    print:border-0 print:p-0` utilities. This fixes 09-RESEARCH.md
    Pitfall 5 (CSS cannot override the `hidden` attribute).
- **`src/components/TopicRow.tsx`**
  - Subscribes to `printMode`.
  - `print:hidden` on the topic notes toggle and the "+ Add question"
    trigger.
  - Topic header button: `print:cursor-default print:px-0 print:pl-0`
    so it flattens for print but stays a real `<button>` for screen
    a11y (kept its `aria-expanded`).
  - Topic notes panel wrapper: `print:px-0 print:py-1 print:border-0`
    so the notes flow inline with the question list on print.
  - Topic notes textarea: same conditional hidden pattern
    (`hidden={!topicNotesOpen && !localTopicNote && !printMode}`) +
    same print utility set.
- **`src/components/ContentTree.tsx`**
  - Imports `useAppStore` and reads `candidate`.
  - Adds `<div aria-hidden="true" className="hidden print:block
    print:mb-4">` above the virtualizer rendering `<h1>{candidateName
    || 'Interview Session'}</h1>` and `<p>{candidateRole}{role && date
    ? ' — ' : ''}{candidateDate}</p>`. Visible only on print; screen
    users see the candidate via `CandidateModal`.

## Checkpoint — CRXJS build verification

`npm run build` was run after both task commits. Result:

```
✓ 80 modules transformed.
dist/src/app/app.html                      0.59 kB
dist/src/app/welcome.html                  0.59 kB
dist/assets/src/app/welcome-vdAIBzs_.js    3.76 kB
dist/assets/src/app/app-B7Px1kJP.js      192.81 kB
✓ built in 129ms
```

Both HTML entries land in `dist/`, the welcome page has its own JS
chunk, exit code 0, no Rollup/CRXJS errors. The CRXJS issue #876
fallback path (static `public/welcome.html` with inline CSS) was NOT
needed.

The only warning emitted is the pre-existing CRXJS "Both
`rollupOptions` and `rolldownOptions` were specified by
`crx:content-scripts`" notice — unchanged from the previous build,
unrelated to this plan's second entry.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Welcome files exist | `ls src/app/welcome.html welcome-main.tsx Welcome.tsx` | All 3 present |
| `hasSeenWelcome` written | `grep -c "hasSeenWelcome" src/app/Welcome.tsx` | 2 (declaration + set call) |
| `printMode` in QuestionCard | `grep "printMode" src/components/QuestionCard.tsx` | 3 hits (comment + selector + hidden prop) |
| `printMode` in TopicRow | `grep "printMode" src/components/TopicRow.tsx` | 3 hits |
| `print:hidden` count QuestionCard | `grep -c "print:hidden" src/components/QuestionCard.tsx` | 3 |
| `print:hidden` count TopicRow | `grep -c "print:hidden" src/components/TopicRow.tsx` | 2 |
| Vite entry | `grep welcome vite.config.ts` | `'src/app/welcome': 'src/app/welcome.html'` |
| Production build | `npm run build` | exit 0; both HTML entries in `dist/` |
| Test suite | `npx vitest run` | 510 / 510 pass (38 files) |
| TypeScript | `npx tsc --noEmit` | 0 new errors in files touched by this plan |

Pre-existing TS errors in `src/background/index.test.ts` (vitest-chrome
typing mismatch + `not a module` message) are out of scope — they exist
on this branch before plan 09-03 began and live in Plan 09-01 territory.

## Deviations from Plan

### Auto-added critical functionality

**1. [Rule 2 — Missing critical functionality] `activeSessionOverride` handler in `src/app/main.tsx`**

- **Found during:** Task 1 (drafting Welcome.tsx CTAs).
- **Issue:** The "View demo session" CTA writes
  `activeSessionOverride: 'demo'` to `chrome.storage.local`, but the
  PLAN.md only described this in a *note* on the welcome page CTA;
  `main.tsx` had no reader for the key. Without a reader, the CTA
  would silently fail to switch the session — the user would land on
  whatever session was already active.
- **Fix:** Added a small post-bootstrap try/catch block in `main.tsx`
  that reads `activeSessionOverride`, calls
  `useAppStore.getState().switchSession(overrideId)` when it differs
  from `activeSessionId`, then calls
  `chrome.storage.local.remove('activeSessionOverride')` so the key
  is a one-shot signal. Non-fatal on error — the app still renders.
- **Files modified:** `src/app/main.tsx`.
- **Commit:** included in `8949fc9` (Task 1).

### Verify-step deviations

**2. [Rule 2 — Print readout] Print-only score readout in QuestionCard**

- **Found during:** Task 2 (applying `print:hidden` to the slider row).
- **Issue:** Hiding the entire score slider row on print also hides
  the "N / 10" readout `<span>` that lives inside the same flex row,
  meaning printed pages would show the question text and notes but
  not the score the interviewer captured.
- **Fix:** Added a sibling `<div className="hidden print:block ...">`
  that prints the score as plain text. Tagged `print:mt-1 text-sm
  font-normal text-gray-700` to match the print typography.
- **Files modified:** `src/components/QuestionCard.tsx`.
- **Commit:** included in `8c6ab0c` (Task 2).

No other deviations. No architectural changes. No package installs.

## Threat surface scan

No new network endpoints, no new auth paths, no new file access. The
welcome page only:

- Reads `chrome.runtime.getManifest().version` (extension-owned text,
  auto-escaped via React text nodes).
- Writes `hasSeenWelcome: true` and `activeSessionOverride: 'demo'`
  (both convenience flags, not security controls — explicitly
  accepted in T-09-10 of the plan's threat register).
- Opens `chrome.runtime.getURL('src/app/app.html')` via
  `chrome.tabs.create` — URL is extension-controlled, no user input
  in URL (mitigates T-09-09).
- `T-09-11` (CRXJS build failure DoS) mitigated by the checkpoint:
  `npm run build` exits 0 and produces both HTML entries.
- `T-09-SC` `accept` holds — zero new packages installed.

## Known Stubs

None. Welcome page, print CSS, and the candidate-header are all wired
to live data sources (`chrome.runtime.getManifest`, `chrome.storage.local`,
`useAppStore`).

## Self-Check

- `src/app/welcome.html` — FOUND
- `src/app/welcome-main.tsx` — FOUND
- `src/app/Welcome.tsx` — FOUND
- `vite.config.ts` welcome entry — FOUND (`grep welcome vite.config.ts`)
- `src/app/main.tsx` override handler — FOUND
- `src/components/QuestionCard.tsx` printMode + print:hidden — FOUND
- `src/components/TopicRow.tsx` printMode + print:hidden — FOUND
- `src/components/ContentTree.tsx` candidate header — FOUND
- `dist/src/app/welcome.html` — FOUND (build artifact)
- `dist/src/app/app.html` — FOUND (build artifact)
- Commit `8949fc9` (Task 1) — FOUND in `git log`
- Commit `8c6ab0c` (Task 2) — FOUND in `git log`

## Self-Check: PASSED
