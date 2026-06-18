---
phase: 07-yaml-import-export
fixed_at: 2026-06-17T17:42:00Z
review_path: .planning/phases/07-yaml-import-export/07-REVIEW.md
iteration: 2
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-06-17T17:42:00Z
**Source review:** .planning/phases/07-yaml-import-export/07-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 6 (CR-01, CR-02, WR-01, WR-02, WR-03, WR-04)
- Fixed: 6
- Skipped: 0

Test suite after all fixes: **440 passed, 0 failed** (`npx vitest run`)

---

## Fixed Issues

### CR-01: Snapshot captures stale data — pending writes not flushed before snapshot()

**File modified:** `src/store/app.ts`
**Commit:** `9001268`
**Applied fix:** Added `storageAdapter.flushPending()` call immediately before `storageAdapter.snapshot(activeSessionId)` in `importSession`. The method already exists and is used in other store actions (e.g. `switchSession`). Added explanatory comment noting that `snapshot()` reads from `chrome.storage.local` directly and does not consult the in-memory pending write buffer.

---

### CR-02: parseStructural — out-of-bounds question index creates orphan storage keys

**File modified:** `src/utils/yamlImport.ts`
**Commit:** `c9f0f60`
**Applied fix:** Built a `topicQuestionCount: Map<string, number>` alongside the existing `topicIdSet` loop, counting `topic.questions.length` for each topic. In the question processing loop, after the existing non-negative integer check, added `const maxIndex = topicQuestionCount.get(topicId) ?? 0; if (index >= maxIndex) continue;` to reject out-of-bounds indices before they reach storage.

---

### WR-01: Confirm button has no in-flight guard — double-click creates duplicate sessions

**File modified:** `src/components/ImportPreviewModal.tsx`
**Commit:** `c464396`
**Applied fix:**
- Added `const [isPending, setIsPending] = useState(false);` state.
- Reset `isPending` to `false` in the `useEffect` that resets other state when `preview` changes.
- Updated `handleConfirm` to early-return if `isPending`, set it `true` at the start, and reset it in a `finally` block.
- Added `disabled={isPending}` to the Confirm button, updated label to `{isPending ? 'Importing…' : 'Confirm'}`, and added `disabled:opacity-50 disabled:cursor-not-allowed` CSS classes.

---

### WR-02: Duplicate topicId in YAML produces duplicate custom-question IDs

**File modified:** `src/utils/yamlImport.ts`
**Commit:** `646450d`
**Applied fix:** Before the `customQuestions.forEach` loop for each topic, added code to remove any previously accumulated `result.customQuestions` entries with the same `topicId` (enforcing last-write-wins) and subtract their count from `addedCount`. This ensures duplicate topic entries in YAML cannot produce colliding IDs from `Date.now()` + same `cqIndex`.

---

### WR-03: parseStructural writes empty-string topicNote — inconsistent with note handling

**File modified:** `src/utils/yamlImport.ts`
**Commit:** `aab4f48`
**Applied fix:** Changed the `topicNote` guard from `typeof topic.topicNote === 'string'` to `typeof topic.topicNote === 'string' && topic.topicNote !== ''`. This matches the existing `q.note` guard pattern and the sparse behaviour of `resetAll()`. Prevents round-trip import from inflating storage with empty-string entries for every topic that has no note.

---

### WR-04: buildFilename produces malformed filenames for empty or whitespace-only session names

**File modified:** `src/utils/yamlExport.ts`
**Commit:** `4fe24da`
**Applied fix:** Added `.replace(/^-+|-+$/g, '')` step after the existing sanitization chain to trim leading/trailing dashes. Added `|| 'untitled'` fallback for when the result is empty after trimming (handles `''`, `'   '`, `'!!!'`). Updated the JSDoc comment to document these behaviours.

---

_Fixed: 2026-06-17T17:42:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
