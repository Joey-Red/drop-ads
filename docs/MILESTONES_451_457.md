# Milestones 451–457 — Post-popup hardening and collaborator ownership

This canonical continuation follows the independently completed popup M445–450 block. Several source/test commits were created while other continuation work was in flight; the numbering below is the canonical roadmap sequence for this block. No milestone changes Drop Ads' privacy model, permissions, retention policy, or release status.

## Milestone 451 — Arm list-download timeouts before source work

`withListDownloadTimeout()` finishes timer arming before scheduling the source task. A throwing timer implementation performs zero task/network work, and synchronous expiry during arming aborts and fails before the task can start. A returned stale timer handle is cleared best effort. Existing **30,000 ms default / 120,000 ms maximum** timeout bounds, captured AbortController behavior, and normal asynchronous race semantics remain unchanged.

Coverage: `tests/list-timeout-arm-v451.test.js`.

## Milestone 452 — Reject new core work after disposal

The background runtime task queue rejects newly admitted controller work once disposal begins and rechecks disposal when queued work is about to start. Work already executing may finish, but work waiting behind it cannot begin after teardown. `whenIdle()` remains an unguarded drain so callers and teardown can await already-admitted work. Pre-start controller behavior remains supported until the runtime is actually disposed.

Coverage: `tests/runtime-dispose-queue-v452.test.js`.

## Milestone 453 — Capture and await configured refresh-alarm operations

The core runtime captures receiver-bound `alarms.clear` and `alarms.create` collaborators once during construction and uses only those captured operations for configured list-refresh scheduling. Both synchronous/void and promise-returning implementations are awaited, so a create failure after clear remains visible to initialization/import scheduling callers instead of becoming false success. The configured interval keeps the existing **60-minute minimum**.

Coverage: `tests/runtime-alarm-collaborators-v453.test.js`.

## Milestone 454 — Own context-feedback browser collaborators

Context feedback captures context-menu/storage event add/remove operations plus action title/badge, optional tab send, storage.local get, and browser action-count capability collaborators through bounded descriptor/prototype inspection. Captured methods retain their original receivers through `Reflect.apply`; listener installation remains transactional with reverse rollback, and teardown uses captured removers with failure isolation. Existing **128 pending / 128 visible / 60,000 ms** bounds, committed-rule recovery, exact-target cleanup, and browser-owned count behavior remain unchanged.

Coverage: `tests/context-feedback-collaborator-capture-v454.test.js`.

## Milestone 455 — Brand-check optional registration Maps

Optional feature registration stores are admitted using contained intrinsic Map branding rather than `instanceof` or caller-controlled prototype traversal. Genuine Map and Map-subclass instances are accepted; fakes, Proxy-wrapped Maps, and revoked proxies fail deterministically before feature installation. Registration bookkeeping uses intrinsic Map operations while existing **32-feature / 64-character-name** limits and reverse teardown behavior remain unchanged.

Coverage: `tests/background-bootstrap-map-brand-v455.test.js`.

## Milestone 456 — Use native popup heading and action-group semantics

The popup uses native `h1` and `h2` headings for its title/current-site hierarchy, groups Pause/Resume and Pick element as one labelled site-action group, and associates site/cookie controls with the existing explanatory and live-status content. Existing control ids, keyboard tab order, compact matte visual hierarchy, and hidden-until-applicable site behavior are preserved.

Coverage: `tests/popup-native-semantics-v456.test.js`.

## Milestone 457 — Documentation and exact-head release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized without treating repository coverage as browser qualification. The final exact branch head is recorded on Issue #10 after repository edits; PR #7 remains draft until clean preflight and real Chromium + Firefox observations are completed against the exact same source/package hashes.

## Validation status

Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed locally here**. No `npm ci`, `npm run check`, packaging/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed.

These milestones add no telemetry, analytics, browsing/request history, retained statistics or matched-element history, page/DOM history, identifiers, cookie database access, custom Drop Ads backend, new permissions, or remote executable-code path.
