# Supporting regression alignment

`ROADMAP.md` is the sole canonical milestone-number authority. This note preserves useful regression work that landed during concurrent continuation without assigning competing milestone numbers.

## Bootstrap intrinsic collaborator coverage

`tests/background-bootstrap-intrinsics-v440.test.js` covers prototype-looking optional feature names, intrinsic Map registration storage despite shadowed instance methods, captured disposer identity after later mutation, and the existing **64-character** raw optional feature-name admission bound.

## Timeout-controller cleanup coverage

`tests/list-timeout-controller-v438.test.js` covers the canonical timeout-controller cleanup behavior recorded by ROADMAP M460: throwing timer cleanup cannot replace successful task completion, and accessor-shaped synthetic AbortController state fails before timer scheduling. Existing **1–120,000 ms**, default **30,000 ms**, arm-before-task, and abort-on-timeout behavior remain authoritative.

## Popup site-region accessibility coverage

`tests/popup-site-region-v439.test.js` verifies the already-landed popup site-controls region remains labelled/described by visible site context, uses semantic heading structure, and publishes concise status changes through atomic polite live regions without changing control ids, keyboard order, or compact visual behavior.

## Duplicate tracker reconciliation

Concurrent duplicate issue trackers were closed or marked supporting when their requested behavior was already represented by the canonical ROADMAP/detailed records. Closing a duplicate is repository hygiene, not validation and not a release-readiness signal.

## Validation and privacy statement

Connector-created or connector-edited coverage described here was **not executed** locally or in a browser. No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, Chromium run, or Firefox run is claimed by this note.

No telemetry, analytics, browsing/request history, retained matched-rule statistics, identifiers, custom backend, permission expansion, polling, or retention expansion is introduced.
