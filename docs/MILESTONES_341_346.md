# Milestones 341–346 — Selector/context boundary completion

This block continues the content-script hardening line without changing Drop Ads' privacy model, permissions, network/cosmetic precedence, or release gate. Connector-added regression coverage in this block is repository coverage only; no local Node/browser execution is claimed.

## Milestone 341 — Invalid context clock distinction

`rememberedTargetStatus()` now distinguishes malformed clock input from a valid target that simply aged out:

- non-finite, negative, or pre-capture `now` values fail closed as `invalid-context-clock`
- a valid clock more than the existing 10,000 ms target TTL after capture remains `context-target-expired`
- hostile non-numeric clock objects are not coerced
- the focused M339 regression expectation was synchronized with the implemented distinction

The remembered target lifetime itself is unchanged.

## Milestone 342 — Non-coercive selector tokens and tags

Selector generation no longer string-coerces caller-controlled token/tag values:

- stable id/class/attribute tokens are accepted only when already strings
- non-string token values are ignored without `String`, `toString`, `valueOf`, or `Symbol.toPrimitive`
- tag selection uses string `localName` first and string `tagName` as fallback
- tag metadata read failures make that selector part unusable instead of escaping the boundary
- the existing 80-character stable-token ceiling and high-entropy/whitespace rejection remain unchanged

Focused repository coverage: `tests/content-selector-token-boundary-v342.test.js`.

## Milestone 343 — Bounded class-token scan

Selector generation no longer spreads the full `classList` before retaining three tokens:

- at most 64 raw indexed class entries are inspected
- at most three accepted stable class tokens are retained
- class-list metadata/index failures fall back to other selector signals
- invalid/non-integer lengths are rejected as unusable class data
- normal indexed DOMTokenList behavior is preserved

Focused repository coverage: `tests/content-selector-class-scan-v343.test.js`.

## Milestone 344 — Non-coercive context element URL extraction

The exported `elementUrl()` boundary now:

- requires `nodeType === 1` and a string `localName`
- contains element/tag/resource property-read failures and revoked Proxy inputs
- never coerces object-like tag or resource URL values
- forwards resource candidates through the existing string-only, 16,384-character, HTTP(S)-only comparable-URL boundary
- preserves image/media/frame/embed/object/link mappings for ordinary DOM elements

Focused repository coverage: `tests/content-context-element-url-v344.test.js`.

## Milestone 345 — Target-memory retention ceiling

The exported context-target memory helper can no longer be configured to retain targets longer than production:

- direct `ttlMs` must be an integer from 1 through 10,000 ms
- exact 10,000 ms remains valid; one-over is rejected before scheduling
- the production default remains 10 seconds
- generation-safe remember/take/clear behavior is unchanged
- option metadata/proxy failures are converted to deterministic validation errors without inspecting properties on the thrown value

Focused repository coverage: `tests/content-context-target-ttl-bound-v345.test.js`.

## Milestone 346 — Documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10's exact-head record are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative real Chromium/Firefox qualification gate.

No `npm ci`, test/check command, package/release verification, reproducibility run, source qualification, or browser execution is represented as having been performed by these connector-only changes.
