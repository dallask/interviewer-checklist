---
status: complete
phase: 14-editable-bank-yaml-schema-expansion
source: [14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md, 14-04-SUMMARY.md, 14-05-SUMMARY.md]
started: 2026-06-18T15:00:00Z
updated: 2026-06-18T15:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Add a new section
expected: At the bottom of the content tree there is an affordance to add a new section. Clicking it, typing a name, and confirming creates a new section that appears in the list.
result: issue
reported: "no section appears" — affordance may exist but confirming does not add the section to the tree
severity: major

### 2. Add a topic to a section
expected: Within any section (default or user-added), there is an affordance to add a new topic. Clicking it, typing a name, and confirming adds a topic under that section.
result: issue
reported: "no topic appears" — affordance may exist but confirming does not add the topic
severity: major

### 3. Delete a user-added section
expected: A user-added section has a delete/remove button (× or trash). Clicking it removes the section and its topics from the tree.
result: skipped
notes: depends on Test 1 (add section) which failed

### 4. Delete a user-added topic
expected: A user-added topic has a delete/remove button. Clicking it removes the topic from its section.
result: skipped
notes: depends on Test 2 (add topic) which failed

### 5. Delete a default question
expected: Hover over any question from the built-in bank. A delete button appears. Clicking it removes that question from the topic permanently (for this session). The question count in the section filter decreases.
result: pass

### 6. YAML export includes text and level on questions
expected: Click the export (📤) button to download a YAML. Open the file. Each question entry under a default topic should include a `text:` field with the question text and a `level:` field (novice/intermediate/advanced/expert) alongside the score and note fields.
result: pass

### 7. YAML round-trip preserves bank edits
expected: After adding a section, a topic, and deleting a default question — export to YAML. Then import that YAML back (overwrite). The session should restore with the same custom section, custom topic, and the deleted default question still absent.
result: pass
notes: tested partial round-trip (deleted question only, since add section/topic failed) — deletion preserved correctly after import

## Summary

total: 7
passed: 3
issues: 2
pending: 0
skipped: 2
blocked: 0

## Gaps

- truth: "Adding a new section via the UI affordance creates and displays the section in the tree"
  status: failed
  reason: "User reported: no section appears after confirming"
  severity: major
  test: 1

- truth: "Adding a new topic to a section via the UI affordance creates and displays the topic"
  status: failed
  reason: "User reported: no topic appears after confirming"
  severity: major
  test: 2

- truth: "YAML export/import uses no explicit index keys — item order in the hierarchy implies position"
  status: failed
  reason: "export includes index keys on items; order should be self-determined by element position in the YAML hierarchy"
  severity: minor
