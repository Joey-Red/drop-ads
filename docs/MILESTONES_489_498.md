# Milestones 489–498 — Post-merge qualification and popup boundary hardening

Completed after PR #7 was intentionally merged to `main` before real-browser qualification.

- **489:** post-merge qualification state is explicit: `main` is the authoritative implementation line, Issue #10 remains the real Firefox + Chromium release gate, qualification must bind to one exact `main` head and matching generated package hashes/fingerprint, and later source commits invalidate earlier browser observations.
- **490:** popup `storage.onChanged` registration now captures `storage`, `onChanged`, and `addListener` through a bounded **8-prototype-level** data-property-only collaborator boundary and preserves the owning event receiver through `Reflect.apply`.
- **491:** popup active-tab discovery captures `tabs` and `tabs.query` through the same boundary, preserves the `tabs` receiver, and uses one fixed frozen `{active:true,currentWindow:true}` query envelope.
- **492:** popup core/runtime requests capture `runtime` and `runtime.sendMessage` through the bounded collaborator boundary and preserve the owning runtime receiver rather than performing mutable namespace lookups at dispatch time.
- **493:** the popup Settings action captures `runtime.openOptionsPage` through the same receiver-preserving data-property-only boundary while existing bounded synchronous/asynchronous failure feedback remains intact.
- **494:** element-picker launch captures `tabs.sendMessage`, requires a non-negative safe-integer tab id before browser collaborator access, preserves the owning `tabs` receiver, and fixes dispatch to a frozen `{frameId:0}` top-frame options envelope.
- **495:** popup storage live-sync now captures `removeListener` before registration, returns an idempotent best-effort disposer that removes the exact listener identity through the original event receiver, and disposes on popup `pagehide`; removal failure cannot escape shutdown.
- **496:** committed popup state renders use a monotonic generation claimed before awaiting state. Only the newest completion may publish global/site controls, and storage-driven refresh clears status only after a completion actually publishes.
- **497:** popup-visible caught/runtime failure messages retain the existing **1,024-character** ceiling and now reject C0 controls, DEL, U+2028, and U+2029. Unsafe browser/runtime error text falls back to reviewed bounded status copy instead of being echoed.
- **498:** this document closes the continuation block and reconciles post-merge release-gate guidance. Historical text that says PR #7 must remain draft is superseded: PR #7 is already merged. **Issue #10 remains open and authoritative for actual exact-head Chromium + Firefox qualification.**

Focused repository regression coverage was added for the collaborator, lifecycle, ordering, and error-text boundaries above. Connector-created or connector-edited coverage is repository evidence only and is **not represented as executed local, package, or browser validation**.

No milestone in this block adds telemetry, analytics, browsing/request history, retained match statistics, identifiers, a custom Drop Ads backend, polling, or additional extension permissions.
