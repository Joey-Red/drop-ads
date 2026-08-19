# Background startup fault boundary

Drop Ads uses one mandatory background path and several optional browser/UI helpers.

The mandatory path is intentionally fail-loud:

1. construct the background runtime through the import-guarded WebExtension API
2. start the core blocking runtime
3. install policy convergence/recovery

If any mandatory step fails, bootstrap throws. The extension must not present itself as protective when the blocker or its transaction-recovery layer did not initialize.

Optional features are isolated after the mandatory path is live:

- browser-owned action-count display
- context-block feedback
- declarative cosmetic runtime

A synchronous exception from one optional installer is logged locally to the extension console, recorded only in the in-memory bootstrap return value used by tests, and does not prevent later optional installers from running. No startup status, error report, identifier, telemetry event, browsing information, or request data is persisted or transmitted.

This boundary specifically protects Manifest V3 service-worker registration from being taken down by a nonessential helper while keeping failures in the actual blocker visible and actionable.
