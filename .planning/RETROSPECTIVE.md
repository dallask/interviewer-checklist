# Retrospective

## v1.1 Post-UAT Fix + Polish (2026-06-18)

**Duration:** Single-day sprint (2026-06-18)
**Phases:** 5 (Phases 11–15)
**Plans:** 17 plans, 28 tasks
**Scale:** 56 files changed, +4,857/−724 src/ lines, ~21,995 LOC total, 675/675 tests

### What Went Well

**V3→V4 migration was the right foundation call.** Landing the schema change in an isolated Phase 11 before any other v1.1 work meant that Phases 13–15 got the editable-bank store for free — no rework when the UI affordances landed in Phase 14.

**Test suite as a safety net.** The 675-test suite caught the SectionFilter/DifficultyFilter `store.sections` subscription gap during the integration audit (before shipping), not after. The TDD-first approach on all Phase 14 store actions (18 new tests) meant the UI layer in 14-04 had a verified contract to bind to.

**Phase sequencing held.** The planned dependency order (Phase 11 → Phases 12/13/14 in parallel → Phase 15) was the right call. Phase 15's sticky header + compact card depended on the sidebar layout from Phase 12's desktop-toggle fix, and that dependency was captured in the ROADMAP before execution started.

**Compact QuestionCard isolation.** Isolating SCORE-08 into Phase 15 alongside the sidebar shell refactor kept the visual-redesign diff reviewable. Mixing it into Phase 12 with the defect fixes would have made the commit history harder to follow.

### What Was Hard

**DEFAULT_SECTIONS → store.sections migration surface.** SectionFilter and DifficultyFilter were originally reading from DEFAULT_SECTIONS. The switch to `store.sections` was a cross-cutting change that the test mocks didn't cover initially — test failures surfaced during the milestone audit gap closure, not during phase execution. A better pattern would have been a lint rule or type alias that prevented DEFAULT_SECTIONS imports in components that should read from the store.

**Phase 14 was the largest single diff in v1.1.** 5 plans, 8 requirements, and an entirely new virtual-row taxonomy (add-topic-trigger, add-section-trigger). The wave structure (schema → store actions → YAML → UI → tests) worked, but Wave 3 (UI) required touching ContentTree dispatch logic that was already complex. The complexity was manageable because the store API was locked before UI work started.

**YAML schema v2 round-trip.** The bank delta block in YAML (added/removed sections/topics, removed default question IDs) was non-trivial to get right. The key insight (encode bank mutations as deltas, not full snapshots) was the right call for file size and human readability, but the `parseStructural` extension needed careful handling of absent `bankDelta` fields for v1-format imports.

### What to Carry Forward

**Wave architecture for inter-dependent plans.** The Wave 1 / Wave 2 (blocked on X) pattern from Phases 14 and 15 was explicit about parallelism boundaries and prevented accidental ordering assumptions during execution.

**Integration audit before milestone close.** The milestone audit caught the SectionFilter/DifficultyFilter integration gap that phase-level verification missed (each phase verified its own deliverable; cross-phase wiring is a separate check). Run integration checks as a pre-close gate, not post-close.

**VERIFICATION.md as a deferred-items contract.** The `human_needed` classification for browser-only behaviors worked well as an explicit acknowledgment mechanism. Items aren't "done" or "skipped" — they're "verified by code, deferred for browser UAT." This distinction lets the milestone close without false confidence.

### Deferred Items Carried into v1.2

- Browser-level UAT for Phases 12–15 `human_needed` verifications (compact card layout, sticky header behavior, AboutModal dialog, filter live-count reactivity with bank mutations)
- v1.0 deferred: Phases 5, 6, 7, 8, 9 human_needed browser verifications; 3 UAT scenarios from phases 3, 5, 6
- CWS submission: publish PRIVACY.md to HTTPS, capture screenshots, upload dist.zip

---

## v1.0 Chrome Extension Launch (2026-06-18)

**Duration:** Multi-day sprint (2026-06-16 – 2026-06-18)
**Phases:** 11 phases (Phases 1–10 + 7.1 audit closure)
**Plans:** 30 plans, 36 tasks
**Scale:** ~17,862 LOC TypeScript, 515/515 tests at close

### What Went Well

Full-stack TDD from Phase 1 (vitest pipeline) through Phase 9 (polish) produced a 515-test suite with no coverage gaps in the scoring engine or storage layer. The hardest correctness problems (V2→V3 migration, session schema validation, YAML import format detection) were caught by tests, not by manual exploration.

CRXJS + Vite 8 eliminated the manual copy-assets step that MV3 builds typically require. Zero dependency changes after Phase 7 (js-yaml) meant the full CI pipeline (biome + tsc + vitest + build + safety check) ran identically from Phase 8 onward.

### What Was Hard

Phase 7.1 audit closure was an unplanned insertion — YAML wiring between ActionsGroup and the import utilities was missed in Phase 7's scope. The fix was small (a few lines of wiring) but the detection was late (v1.0 milestone audit). Earlier integration checks between phases would have caught it sooner.

### Deferred Items

- 5 phases (5, 6, 7, 8, 9) had `human_needed` verifications — all browser-level behaviors (scoring interactions, session modal flows, YAML round-trips, AI prompt clipboard, print layout).
- 3 UAT scenarios across phases 3, 5, 6 required manual browser execution.
- CWS submission itself was a manual action (screenshots, privacy policy HTTPS URL, store listing copy).
