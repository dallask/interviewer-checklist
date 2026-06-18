# Milestones

## v1.0 Chrome Extension Launch (Shipped: 2026-06-18)

**Phases completed:** 11 phases, 30 plans, 36 tasks

**Key accomplishments:**

- npm project bootstrapped with React 19, Vite 8, CRXJS 2.6, TypeScript 6, Biome 2.5.0, Vitest 4, and Tailwind 4 — all dependencies installed and quality pipeline (biome ci + tsc --noEmit + vitest) passing
- Chrome MV3 extension artifact created: manifest.json with storage-only permissions, CRXJS+React+Tailwind Vite config, React 19 app scaffold, 12-LOC stateless service worker with tab dedup, and 28 passing structural tests
- MV3 safety audit script and GitHub Actions CI/release pipeline created — `npm run ci:check-dist` exits 0 on clean build and exits 1 on eval/localhost/bad-permissions/default_popup violations; both workflows wire lint+typecheck+build+safety
- Question bank extracted verbatim from prototype (9 groups, 86 topics, 1067 questions) with TypeScript readonly interfaces and DIFFICULTY_COEFFICIENTS; @vitest/coverage-v8 installed with 100% threshold coverage config; TDD structural assertions confirm exact bank counts
- Pure scoring engine with difficulty-weighted topic marks, plain-mean section/overall marks, getMarkBand with CONTEXT.md thresholds; 26 unit tests with prototype-derived Twig fixture; 100% branch/line/function/statement coverage on src/scoring/
- valibot-validated V1-to-V2 migration pipeline with vitest-chrome global, frozen fixture-pinned TDD tests, and extensible runMigrations array runner
- StorageAdapter class with 300ms debounced writes, synchronous flushPending, getBytesInUse quota warning, and FIFO snapshot trim — all via chrome.storage.local.get(null) without getKeys()
- bootstrap() migration orchestrator with valibot validation and recovery path, module-level lifecycle handlers, and top-level await in main.tsx completing all Phase 3 persistence wiring
- Tailwind v4 dark mode with class-strategy, FOUC-prevention theme.ts for MV3 CSP compliance, fully typed Zustand store with subscribe-to-persist serialization, and pure buildFlatRows utility for @tanstack/react-virtual flat-row content tree
- All 11 sidebar/content-tree components implemented with Tailwind v4, full ARIA attributes per UI-SPEC, TDD RED/GREEN cycle, and 199 tests passing
- Full shell layout composing Sidebar, ContentTree, and StorageToast in App.tsx; useAppStore hydrated from bootstrap() uiState with Set reconstruction in main.tsx
- V3SessionSchema with scoring fields, migrateV2ToV3 migration, ScoringActions in useAppStore, buildFlatRows index fix, and main.tsx uiState hydration wired for all Phase 5 scoring UI components
- All interactive scoring UI components built: score slider, topic mark display, notes textareas, custom question form, and live section filter marks — 309 tests passing, npm run ci exits 0
- Native `<dialog>` modals with manual focus traps for candidate details and reset confirmation, ActionsGroup trigger buttons, and hideMarked activation via markedTopicIds computation in App.tsx
- resetAll() in Zustand store now clears all four filter fields per SCORE-06, with TDD-verified assertions; biome column-limit violation in main.tsx fixed so npm run ci exits 0
- Version-aware session validation in bootstrap() Scenario B eliminating CR-03 data-loss path where V3 sessions were silently replaced by empty V2 defaults
- Zustand store extended with manifest/undoBuffer state and six session management actions (createSession, renameSession, duplicateSession, deleteSession, switchSession, undoDeleteSession) with TDD coverage for SESS-01 and SESS-04.
- Four session management UI components built with TDD — SessionSwitcherModal (native dialog with listbox + focus trap), SessionRow (inline rename with Pitfall 5 blur guard), DeleteSessionConfirmDialog (ResetConfirmDialog pattern), and UndoToast (null-guarded fixed-bottom notification).
- ActionsGroup wired with session label + Switch session trigger + SessionSwitcherModal mount; UndoToast mounted at App root; manifest hydrated from chrome.storage into Zustand on bootstrap; slide-up keyframe added to styles.css.
- Pure YAML I/O utilities using js-yaml 4.2.0 — exportSession (V3Session→YAML string with topicId-questionIndex keys) and importSession parsers (parseYaml/detectFormat/parseLegacy/parseStructural) with TDD coverage.
- importSession store action with snapshot-before-mutation (STORE-05/T-07-05) and ImportPreviewModal native dialog with new-session/overwrite toggle, both fully TDD-covered.
- Wired existing yamlExport/yamlImport/ImportPreviewModal/importSession into ActionsGroup (YAML-01/02/03) and replaced the broken `js-basics-*` demo seed score keys with real `js-0`, `js-1`, `twig-0` IDs (POLISH-01).
- Pure `buildAiPrompt(session, sections)` function that assembles a multi-section AI feedback prompt string from V3Session data, with difficulty-weighted topic notes and a structured task spec block.
- Prop-driven `AiPromptModal` native dialog with editable textarea, clipboard copy, "Copied!" flash, and fallback instruction; wired into `ActionsGroup` via trigger button that generates the prompt on click.
- Added `commands._execute_action` to `manifest.json` with default key `Alt+Shift+I` (POLISH-02). Manifest declaration alone routes to existing `chrome.action.onClicked` listener — no `chrome.commands.onCommand` listener needed per RESEARCH.md finding.
- 1. [Rule 1 — Bug] `chrome.runtime.getManifest` mock missing in `Sidebar.test.tsx`
- 1. [Rule 2 — Missing critical functionality] `activeSessionOverride` handler in `src/app/main.tsx`

---
