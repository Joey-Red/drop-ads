# Milestones 374–379 — Cosmetic refresh ordering and selector work bounds

This hardening block keeps content-script cosmetic state and selector work deterministic under scheduler failure, stale asynchronous completion, stale observer callbacks, and oversized page-controlled selector signals. It does not add telemetry, history, identifiers, permissions, backend services, or longer retention.

## Milestone 374 — Cosmetic refresh scheduler failure containment

`queueRefresh()` no longer leaves its coalescing flag permanently set if `queueMicrotask()` lookup/call fails. The flag is cleared and a direct best-effort `refresh()` is started, so later cosmetic refresh messages remain usable and stale CSS is not retained solely because microtask scheduling failed.

Repository coverage: `tests/content-cosmetic-refresh-queue-v374.test.js`.

## Milestone 375 — Reattachment observer identity

Each cosmetic reattachment callback is bound to the exact `MutationObserver` that created it. A stale callback from an older observer returns without touching the current style or observer. Completion disconnects only the matching current observer, and callback failure removes style only when that observer is still authoritative.

Repository coverage: `tests/content-cosmetic-observer-identity-v375.test.js`.

## Milestone 376 — Refresh generation ordering

Every cosmetic policy refresh receives a monotonically increasing generation. Only the newest generation may apply or remove style after its asynchronous background response settles. An older successful response cannot reapply stale CSS after a newer refresh, and an older failure cannot remove a newer successfully applied style.

Repository coverage: `tests/content-cosmetic-refresh-generation-v376.test.js`.

## Milestone 377 — Raw selector-token work preflight

`stableToken()` now rejects raw page-controlled id/class/reviewed-attribute strings over the existing **400-character selector work ceiling** before `trim()` or regular-expression work. The existing accepted stable-token ceiling remains **80 characters**, including existing unstable long-hex and long-numeric rejection.

Repository coverage: `tests/content-selector-token-raw-bound-v377.test.js`.

## Milestone 378 — Tag normalization work preflight

Selector tag normalization now rejects empty or over-**400-character** raw `localName`/`tagName` strings before lowercase allocation. `localName` preference, `tagName` fallback, lowercase normalization, property-trap containment, and the later canonical tag grammar remain unchanged.

Repository coverage: `tests/content-selector-tag-bound-v378.test.js`.

## Milestone 379 — Documentation and exact-head gate synchronization

This milestone records M374–378 in the roadmap and draft PR, then records the exact resulting branch head on Issue #10. PR #7 remains draft and Issue #10 remains the authoritative Chromium + Firefox qualification gate.

The regression files added in this block are repository coverage only. They were not executed through the connector, and no `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, or real-browser qualification is claimed here.
