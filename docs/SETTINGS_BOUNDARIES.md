# Settings trust and privacy boundaries

Drop Ads Settings are extension UI, not a privileged escape hatch around the blocker’s privacy model. Primary Settings, Country/region controls, Cosmetic controls, and Protection action-count controls must stay browser-local and must use the same reviewed background transaction and validation paths as the popup.

## Runtime messaging

Settings-to-background messages are routed through `sendOptionsRuntimeMessage()` rather than direct `api.runtime.sendMessage` calls. The helper captures the browser runtime namespace and `sendMessage` collaborator through bounded data-property inspection, preserves the owning receiver with `Reflect.apply`, and rejects accessor/proxy/non-function collaborator surprises.

Before dispatch, the top-level message envelope must be an ordinary or null-prototype object with at most **8 own fields**. Symbol fields, accessors, non-enumerable fields, custom prototypes, and prototype/key/descriptor traps are rejected. The accepted top-level envelope is copied to a null-prototype object and frozen before dispatch. Nested rule/subscription/backup values retain their existing exact background message-contract validation and reviewed size/work ceilings.

Background responses are not trusted merely because they came from the extension runtime. Settings response helpers continue to enforce exact response shapes, bounded strings/results, allowed statuses, and typed subscription/import outcomes before UI publication.

## Storage synchronization and asynchronous UI state

Every shipped Settings surface now routes `storage.onChanged` live-sync through `installOwnedOptionsStorageListener()` rather than direct browser-event access or the older unowned helper. The shared helper captures both `addListener` and `removeListener` through bounded descriptor-only data-property inspection, verifies both before registration, preserves the event receiver with `Reflect.apply`, retains the exact listener identity, and returns an idempotent best-effort disposer.

Primary Settings, Country, Cosmetic, and Protection action-count Settings retain that disposer and release the exact live-sync registration from a one-shot `pagehide` lifecycle path. Their teardown paths also prevent already-started or queued storage refreshes from publishing after page teardown. Country and Cosmetic pages retain generation guards for stale asynchronous state reads; Protection action-count invalidates its committed-refresh generation; Country’s personal-list relabel observer is owned, coalesced, and disconnected on `pagehide`.

These lifecycle protections are UI correctness and resource-ownership boundaries only. They do not justify retaining browsing activity, request history, DOM snapshots, identifiers, or per-site statistics.

## Forbidden Settings-side data surfaces

Settings UI and the shared Settings runtime/storage collaborator helpers must not directly use network or observation primitives such as `fetch`, XMLHttpRequest, WebSocket, EventSource, `sendBeacon`, `webRequest`, or `declarativeNetRequestFeedback`. They also must not introduce browser-history reads, IndexedDB, localStorage, or sessionStorage as side databases. Reviewed filter-list networking remains background-owned and subject to the existing public-HTTPS admission, hostile-input bounds, transaction, cache, and last-known-good rules.

`tools/settings-privacy-surface-audit.mjs` scans all four Settings UI modules plus `src/core/options-runtime.js` and `src/core/options-storage-listener.js`, and remains part of `npm run check`. `tools/ui-hardening-audit.mjs` separately enforces the owned listener/disposer lifecycle and the existing runtime-message, ordering, observer, and message-envelope invariants.

## Non-negotiable privacy invariants

- No telemetry or analytics.
- No browsing/request history.
- No matched-element or DOM history.
- No retained blocked-request statistics database.
- No user/device identifiers.
- No owned Drop Ads tracking backend.
- Optional community preparation remains separate from successful local blocking and is never required for normal operation.

## Qualification status

Repository tests and source audits are preflight evidence. Connector-created tests/audits are not represented as executed validation. Issue #10 remains the authoritative real Firefox + Chromium qualification gate for the exact current `main` commit and exact generated package hashes.

See `docs/MILESTONES_529_538.md` for the lifecycle-hardening continuation block.
