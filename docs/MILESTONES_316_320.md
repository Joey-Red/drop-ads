# Milestones 316–320 — Content-script collaborator hardening

This block closes descriptor, response, and UI-error gaps at the content-script boundary without changing Drop Ads privacy, blocking, permission, or release semantics.

## M316 — Descriptor-safe content message snapshots

`src/content/message-contract.js` now validates the three reviewed background-to-content messages as exact ordinary/null-prototype own-data objects. Arrays, symbols, unknown/hidden/accessor fields, custom prototypes, and prototype/own-key/descriptor traps fail closed. Accepted messages are detached into frozen null-prototype snapshots before use. The cleanup action retains the reviewed **16,384-character** target URL ceiling, and `context-cleanup.js` now consumes the detached snapshot instead of rereading caller-controlled message data.

## M317 — Bounded cosmetic policy responses

The cosmetic content script no longer directly dereferences a background reply. `snapshotCosmeticPolicyResponse()` enforces mutually exclusive exact success/failure envelopes. A successful policy is exact `enabled` / `selectorCount` / `stylesheet` own-data, keeps the existing **2,048-selector** ceiling, and independently enforces the existing **256 KiB UTF-8 stylesheet** ceiling before the style is applied. Disabled policy must remain the canonical zero-count/empty-stylesheet form. Malformed, failed, or unavailable policy removes stale extension style.

## M318 — Bounded picker save responses and caught errors

The shared content boundary now exposes a **1,024-character** caught-error helper that accepts only an own data `message`; accessors, traps, oversized values, and type confusion fall back to reviewed local text. Picker cosmetic-save replies are exact outcome-exclusive `{ok,result}` or `{ok,error}` envelopes before the picker acts on them. Selector-generation and save failures use the bounded helper, while successful save still follows the same local-only site-scoped rule and idempotent cleanup path.

## M319 — Revoked Proxy containment

A revoked `Proxy` can cause `Array.isArray()` itself to throw before later descriptor trap containment executes. The content boundary now centralizes a safe non-array object predicate and uses it before message/response own-data inspection and nested picker rule shape checks. Revoked root or nested Proxies therefore fail closed rather than escaping the boundary. All M316–318 schemas and limits remain unchanged.

## M320 — Documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this content collaborator block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox gate.

## Validation status

The regression files added for M316–320 are **repository coverage only**. They were created through the GitHub connector and were not executed here. No `npm ci`, `npm run check`, package/release verification, reproducibility run, source qualification, or real Chromium/Firefox observation is claimed by this block.

No telemetry, analytics, browsing/request history, retained page/DOM data, identifiers, custom backend, new permission, or executable remote-code path was introduced.
