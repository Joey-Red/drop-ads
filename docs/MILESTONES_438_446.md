# Milestones 438–446 — Runtime and collaborator boundary completion

This block continues fail-closed descriptor-safe and bounded-work hardening without changing Drop Ads' Firefox + Chromium browser-local architecture, reviewed permissions, transaction model, or privacy policy. Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed as local/package/browser qualification** in this workflow.

## Milestone 438 — Abort-signal body-read collaborator capture

Remote streamed-body reads capture abort state and listener collaborators before reader work. Native `AbortSignal` uses the platform `aborted` accessor and captured `EventTarget` add/remove data methods with the original signal receiver; synthetic signals require descriptor-safe own-data boolean/function fields. Later body processing uses only the captured interface, and listener cleanup remains best effort.

Focused coverage: `tests/list-abort-signal-collaborators-v438.test.js`.

## Milestone 439 — Policy-convergence event collaborator capture

Mandatory policy convergence captures runtime-message, context-menu, and alarm event `addListener` plus optional `removeListener` operations once through bounded descriptor/prototype inspection. Registration is transactional, including add-then-throw cleanup and reverse rollback of earlier installs. Disposal uses only captured removers and releases logical registration identity independently of browser teardown failure.

Focused coverage: `tests/policy-convergence-event-methods-v439.test.js`.

## Milestone 440 — Timeout AbortController capture and cleanup isolation

List-download timeout setup captures native or safe injected AbortController signal/abort collaborators immediately after controller construction. Timeout work uses only those captured values, and timer cancellation is best effort so cleanup failure cannot replace the task or timeout outcome. The existing **30,000 ms default / 120,000 ms maximum** remains unchanged.

Focused coverage: `tests/list-update-abort-controller-collaborators-v440.test.js`.

## Milestone 441 — Prototype-safe normalized list-cache dictionaries

`normalizeListCache()` returns null-prototype dictionaries for successful normalization and invalid-root fallback. Canonical subscription ids such as `constructor` therefore cannot become inherited cache hits, while a genuine own canonical `constructor` entry remains representable. Existing **256 root-entry / 300,000 policy-item / 8 MB** cache limits and v2–v5/legacy migration behavior remain unchanged.

Focused coverage: `tests/cache-list-prototype-v441.test.js`.

## Milestone 442 — Popup Settings launch containment

The popup Settings action contains both synchronous `runtime.openOptionsPage()` throws and rejected promise results through the existing bounded popup caught-error/status path. Chromium-style void-returning and promise-returning browser implementations remain compatible; normal one-click behavior is unchanged.

Focused coverage: `tests/popup-settings-launch-v442.test.js`.

## Milestone 443 — Intrinsic optional-registration Map storage

Optional registration stores are admitted through the contained intrinsic Map brand check, and successful disposer records are written with `Reflect.apply(Map.prototype.set, registrations, ...)`. Caller-owned or accessor-backed `set` properties are never read. Registration ordering, optional feature failure isolation, captured disposer semantics, and teardown behavior remain unchanged.

Focused coverage: `tests/background-bootstrap-intrinsic-map-set-v443.test.js`.

## Milestone 444 — Allocation-safe shared dense-array admission

The shared dense-array boundary validates array kind, prototype, length, and the complete canonical own-key shape before allocating the detached result proportional to the declared length. Huge sparse or extra-key arrays therefore fail before proportional detachment, while normal dense arrays still detach and caller-specific maximum-length semantics remain unchanged.

Focused coverage: `tests/object-schema-dense-allocation-v444.test.js`.

## Milestone 445 — Direct external-subscription admission

Direct external-subscription input enters an exact descriptor-safe `id` / `title` / `format` / `sourceUrl` / optional `enabled` snapshot before normalization or state/cache/network/DNR work. Caller-supplied `builtIn` or unknown fields, accessors, custom prototypes, arrays, and revoked proxies fail before side effects. The detached valid candidate is then normalized with `builtIn: false` internally while existing id/source dedupe, public-HTTPS admission, fetch-before-persist, activation, and rollback semantics remain unchanged.

Focused coverage: `tests/runtime-external-subscription-admission-v445.test.js`.

## Milestone 446 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. The resulting exact implementation head awaiting qualification is recorded on Issue #10 rather than hardcoded into the PR body.

No `npm ci`, `npm run check`, packaging/release verification, reproducibility verification, source qualification, qualification-record generation, or real-browser qualification result is claimed from connector-only repository work. Any source commit after a real browser observation invalidates that observation for release qualification.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element statistics, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or remote executable code.
