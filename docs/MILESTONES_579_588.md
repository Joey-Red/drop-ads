# Milestones 579–588 — Serialized qualification recording and next-step guidance

These milestones harden the manual Issue #10 browser-qualification workflow without claiming that any browser scenario has been observed. They preserve the project's zero-telemetry, zero-history, zero-statistics, no-owned-backend, and no-user/device-identifier constraints.

## Milestone 579 — Metadata-free exclusive qualification lock

Added `tools/qualification-observation-lock.mjs` with an atomic exclusive lock directory for qualification-observation writers. The lock contains no PID, hostname, username, timestamp, token, or other identifying metadata.

## Milestone 580 — Clean-checkout-compatible lock path

Added the lock directory to `.gitignore` so exact-head `git status` validation remains meaningful while a qualification writer holds the lock. Lock existence still blocks concurrent writers; it does not weaken source cleanliness checks.

## Milestone 581 — Conflict-checked atomic observation writes

Extended `writeQualificationObservationAtomic()` with an optional exact-current-text expectation. A changed, created, removed, or otherwise different observation file now fails before rename rather than silently overwriting the unexpected contents.

## Milestone 582 — Serialized guarded observation editing

Wrapped `qualify:mark` read/validate/mutate/write work in the shared exclusive lock. Exact clean-head validation, schema validation, candidate preservation, and the new write-conflict check all occur inside the serialized operation.

## Milestone 583 — Serialized observation preparation and reset

Wrapped normal observation preparation and explicit destructive reset in the same lock. Creation expects the artifact to remain absent; replacement expects the exact previously read bytes to remain current before atomic rename.

## Milestone 584 — Lock contention and cleanup regressions

Added focused tests covering exclusive contention, metadata-free lock contents, release after normal completion, and release after a failing task. No automatic stale-lock deletion was introduced.

## Milestone 585 — Observation write-conflict regressions

Added focused tests proving an unexpected current observation is preserved, exact-current replacement succeeds, and absent-file creation can explicitly require continued absence.

## Milestone 586 — Privacy-minimal qualification next-step helper

Added `tools/qualification-observation-next.mjs`. After exact record and current-checkout validation it reports only whether a browser version has been recorded, the next operator action, and at most one canonical scenario id.

## Milestone 587 — Canonical-order/failure-first next-step contracts

Added `npm run qualify:next` plus tests for strict browser arguments, canonical scenario order, browser-version prerequisite, first-failure precedence, completion semantics, and absence of candidate identity, browser-version values, notes, or other sensitive observation contents from the helper output.

## Milestone 588 — Operator workflow synchronization

Updated the qualification runbook, roadmap, and Issue #10 tracking to use serialized writers, conflict-checked persistence, and the read-only next-step helper. A generated hint, test, audit, or repository change remains preflight evidence only and is never represented as a real Chromium or Firefox observation.

## Validation status

These repository changes were created through the connected GitHub workflow. They are not represented as locally executed `npm run check`, package/reproducibility/source qualification, or real Firefox/Chromium runtime observations. Issue #10 remains the authoritative real-browser release gate for the exact candidate that will eventually be tested.
