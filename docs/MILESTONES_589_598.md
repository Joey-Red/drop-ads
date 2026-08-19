# Milestones 589–598 — Browser-isolated qualification evidence

This block hardens the manual Firefox + Chromium qualification evidence format and operator workflow. It does **not** claim that either browser was opened, exercised, or release-qualified. Issue #10 remains the authoritative real-browser gate.

## M589 — Define browser-isolated scenario results

Added immutable schema-v3 constructors with independent Chromium and Firefox `{ status, notes }` result slots for every canonical qualification scenario. The legacy schema-v2 constructor remained temporarily available so the transition could be implemented deliberately rather than by silently changing old readers.

## M590 — Add schema-neutral result accessors

Added bounded accessors that can read status from legacy flat v2 results or nested v3 results during the transition. Browser-specific v3 notes are readable from their own slot. Legacy shared v2 scenario notes are deliberately **not** attributed to either browser because ownership is ambiguous.

## M591 — Validate schema-v3 observations strictly

Extended qualification observation validation for schema v3. Every scenario has exactly `chromium` and `firefox`; each browser result has exactly `status` and `notes`. Unknown fields, malformed structures, unsafe text, unsupported statuses, and notes attached to an `UNOBSERVED` browser are rejected. Existing candidate/package/artifact identity and browser-version requirements remain enforced.

## M592 — Edit browser-isolated results safely

The guarded observation editor now updates only the selected browser's nested result under schema v3. Status and note replacement protection is browser-local, the other browser's evidence is preserved, browser versions remain mandatory before observed results, and persistence retains the exclusive lock plus conflict-checked atomic replacement.

## M593 — Seed schema-v3 observations

`npm run qualify:observation` now generates schema-v3 observation artifacts with independent Chromium and Firefox result slots, all initially `UNOBSERVED` with empty notes. Candidate identity is still copied verbatim from the validated qualification record; generation remains preparation only.

## M594 — Make reset browser-local

Resetting one schema-v3 browser result to `UNOBSERVED` with explicit `--replace` clears only that browser's note and leaves the other browser's status/note untouched. `UNOBSERVED --notes ...` is rejected rather than silently discarding operator input.

## M595 — Bind status to the exact current checkout

Closed a stale-candidate gap in `qualify:status`: the active status reader now validates the qualification record/observation and the exact clean current checkout before returning readiness counts. Output remains privacy-minimal and contains no candidate identity, browser versions, notes, URLs, environment details, browsing history, or identifiers.

## M596 — Harden next-step guidance

`qualify:next` now reads browser-version presence and canonical scenario slots through enumerable data-property inspection, rejecting accessor-backed values without executing getters. Its output remains limited to version-presence, an action, and at most one canonical scenario id; it does not read or emit observation notes or candidate identity.

## M597 — Reject legacy schema-v2 artifacts in the active workflow

Active qualification record audit, status, next-step, and guarded-update workflows now require schema v3. A schema-v2 artifact receives an explicit recovery error because its shared scenario notes cannot be safely auto-migrated into Chromium or Firefox evidence. The supported recovery is to regenerate an exact-head schema-v3 observation through the explicit observation replace workflow, not to guess note ownership.

Diagnostic structural validation can still recognize a bounded legacy v2 shape during this transition, but legacy v2 is not accepted as active qualification evidence.

## M598 — Synchronize the qualification contract

Updated the runbook, observation worksheet, current-state documentation, static qualification audits, ROADMAP, and Issue #10 guidance around schema-v3 browser-isolated evidence. Canonical milestone numbering advances to M599.

## Privacy and evidence boundary

The schema-v3 observation artifact remains intentionally narrow: exact candidate/package identity, browser version/optional behavior-only browser note, and per-browser canonical scenario status/optional behavior-only scenario note. It must not contain hostname, username, cwd/absolute paths, timestamps, environment dumps, device identifiers, personal URLs, browsing/request history, cookies, DOM/page captures, per-site/lifetime statistics, analytics, telemetry, or an owned Drop Ads tracking backend.

Repository and connector-created tests, audits, tools, and documentation in M589–M598 are **preflight evidence only** unless actually executed. No local `npm run check`, packaging/reproducibility/source qualification, or real Firefox/Chromium observation is claimed by this milestone block.
