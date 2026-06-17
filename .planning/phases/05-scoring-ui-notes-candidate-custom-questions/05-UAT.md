---
status: testing
phase: 05-scoring-ui-notes-candidate-custom-questions
source: [05-VERIFICATION.md]
started: 2026-06-17T14:00:00Z
updated: 2026-06-17T14:00:00Z
---

## Current Test

number: 1
name: Full 12-check Chrome extension smoke test
expected: |
  All 12 interaction checks pass in a real Chrome extension load
awaiting: user response

## Tests

### 1. Full Chrome Extension Smoke Test
expected: |
  Load extension as unpacked in Chrome. Run all 12 checks:
  1. Score slider updates live mark display on question card
  2. Scoring a question to 0 shows "0 / 10" (not blank or NaN)
  3. Override input replaces computed mark in topic header
  4. Notes field persists across tab close and reload (chrome.storage.local)
  5. Topic notes persist across tab close and reload
  6. Custom question adds with badge indicator in topic
  7. Delete custom question removes it immediately
  8. Candidate modal opens, saves 6 fields, pre-populates on re-open
  9. Focus trap works in CandidateModal (Tab cycles inside dialog)
  10. Reset all confirmation dialog — "Keep scores" is a no-op
  11. Reset all confirmation dialog — "Reset all" clears scores, notes, candidate, AND filters
  12. hideMarked toggle hides scored topics; section filter shows numeric marks
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
