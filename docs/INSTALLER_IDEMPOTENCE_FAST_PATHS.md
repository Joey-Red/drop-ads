# Installer idempotence fast paths

This record covers an additional post-M457 hardening set on `agent/bootstrap-core`. It is intentionally separate from the canonical numbered ROADMAP while concurrent milestone reconciliation is active.

## Action-count installer

`installActionCount()` still performs exact top-level option-schema validation and descriptor-safe `api` admission. Once the API has a live WeakMap registration, the existing registration is returned before supplied logger validation or storage/DNR namespace recapture.

This makes duplicate installation genuinely idempotent: later mutation of injected/browser collaborators cannot turn an already-successful install into a new failure. First-install capability validation, preference loading/mutation, browser-owned badge behavior, teardown, and reinstall remain unchanged.

Focused repository coverage: `tests/action-count-reinstall-idempotence-v456.test.js`.

## Refresh-watchdog installer

`installRefreshWatchdog()` now returns an existing registration immediately after exact option-schema validation and descriptor-safe `api` admission, before controller, logger, alarm namespace, alarm operation, or event-listener recapture.

The persistent 30-minute watchdog, non-forced refresh call, alarm establishment, failure-isolated logging, disposal, and reinstall semantics remain unchanged.

Focused repository coverage: `tests/refresh-watchdog-reinstall-idempotence.test.js`.

## Policy-convergence installer

`installPolicyConvergence()` now returns an existing registration after exact option validation and descriptor-safe `api` admission, before controller/logger/event recapture.

First installation still validates the background controller, captures browser event collaborators, installs listeners transactionally, coalesces one active convergence plus one rerun reason, bounds discriminator/reason text, isolates sync/log failures, and tears down through captured listener removers.

Focused repository coverage: `tests/policy-convergence-reinstall-idempotence.test.js`.

## Cosmetic-runtime installer

`installCosmeticRuntime()` still detaches the exact runtime option envelope first. The detached `api` is then used for the WeakMap lookup before supplied warning logger or browser event recapture.

The cosmetic runtime therefore preserves its existing live registration even if later duplicate-install options contain a hostile logger. First-install message/storage event validation, serialized mutation work, cosmetic input caching, fanout, bounded error responses, disposal, and reinstall behavior remain unchanged.

Focused repository coverage: `tests/cosmetic-runtime-reinstall-idempotence.test.js`.

## Cross-module regression audit

`tests/installer-reinstall-fast-path-audit.test.js` structurally locks the ordering contract for all four installers:

1. exact option validation / detached option admission;
2. descriptor-safe API identity acquisition;
3. existing-registration lookup and return;
4. only then sensitive logger, controller, namespace, operation, or event collaborator capture.

The audit exists to prevent future refactors from accidentally moving hostile/external collaborator inspection ahead of a duplicate-install fast path.

## Privacy and release status

This hardening adds no telemetry, analytics, browsing history, request history, matched-element history, user/device identifiers, custom backend, permissions, or retention. It does not change network/cosmetic policy precedence or browser qualification requirements.

Connector-created/edited regression coverage in this record is repository coverage only and was **not executed here**. No `npm ci`, test suite, package/release verification, source qualification, Chromium observation, or Firefox observation is claimed by this record.

PR #7 must remain draft and Issue #10 must remain open until the exact current head completes clean machine preflight plus real Chromium and Firefox qualification. Any source commit after browser observation invalidates those observations.
