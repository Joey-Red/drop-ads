# Milestones 499–508 — Executable UI hardening gate

This block converts the most recent popup and Settings hardening into an executable source-level regression gate. `npm run check` now includes `npm run ui-hardening-audit`.

## Completed

- **499:** added the UI hardening audit and wired it into the normal check chain. The popup must route active-tab lookup, top-frame messaging, runtime messaging, Settings opening, and storage live-sync through the reviewed captured collaborators rather than direct browser API calls.
- **500:** the audit requires explicit popup storage live-sync lifecycle ownership: an idempotent disposer, receiver-preserving `removeListener`, and `pagehide` teardown.
- **501:** the audit requires monotonic committed popup render generations so stale async state reads cannot overwrite newer committed controls or clear status as if they published.
- **502:** popup-visible error text remains under the existing **1,024-character** ceiling and rejects C0 controls, DEL, U+2028, and U+2029 through one shared safety predicate used by caught errors and runtime failure responses.
- **503:** popup browser-call arguments remain fixed and reviewed: the active-tab query uses frozen `{active:true,currentWindow:true}`, top-frame picker messaging uses frozen `{frameId:0}`, tab ids are non-negative safe integers, and captured methods retain their owning receivers.
- **504:** main Settings, Country Settings, Cosmetic Settings, and Protection action-count Settings must use the shared descriptor-safe storage-listener helper rather than direct `api.storage.onChanged.addListener` registration.
- **505:** Protection action-count live preference reads remain generation-safe and cannot publish across a newer direct mutation.
- **506:** Country Settings committed renders retain monotonic generation ordering before updating `latestState`, replacing rows, or scheduling personal-list relabeling.
- **507:** Cosmetic Settings committed renders retain monotonic generation ordering before replacing personal hide/allow rule lists.
- **508:** documentation and post-merge qualification guidance are synchronized around the new executable UI gate.

## Qualification status

The audit is deterministic source/preflight coverage. Connector-created or connector-edited coverage is **not** represented as executed local validation and does not replace Issue #10's real Chromium + Firefox matrix.

PR #7 is already merged. Future qualification must use the exact current `main` head and matching generated source fingerprint/package hashes. Any later source commit invalidates earlier browser observations.

No milestone in this block adds telemetry, analytics, browsing/request history, retained statistics, a custom backend, or new browser permissions.
