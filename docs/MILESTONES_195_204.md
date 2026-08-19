# Milestones 195–204

This block tightens runtime/event lifecycle boundaries without changing Drop Ads' privacy model, permissions, blocking precedence, remote-list ceilings, or user-facing policy defaults.

## Milestone 195 — Descriptor-safe streamed reader result envelopes

`readResponseTextBounded()` now validates every awaited stream-reader result as an exact ordinary/null-prototype enumerable-data object. `done` must be a real boolean; non-terminal results require a real `Uint8Array`; terminal results cannot smuggle byte data. Accessors, symbols, hidden/unknown fields, arrays, custom prototypes, missing fields, and type-confused results fail closed, with reader cancellation attempted before the error propagates. Existing Content-Length admission, 5 MB ceiling, fatal UTF-8 decoding, timeout cancellation, and `response.text()` fallback semantics are unchanged.

## Milestone 196 — Exact descriptor-safe cosmetic runtime options

`installCosmeticRuntime()` now accepts only exact `api` and optional `logger` data fields on an ordinary/null-prototype options object. Getter-bearing, hidden, symbolic, unknown, array, and custom-prototype options fail before listener registration or input loading. A supplied logger must provide `warn()`; the omitted default remains `console`.

## Milestone 197 — Descriptor-safe cosmetic runtime message dispatch

The cosmetic runtime reads `type`, `field`, `rule`, and `key` only from own enumerable data descriptors. Getter-bearing, inherited, hidden, array-envelope, or incomplete messages do not enter cosmetic mutation work. Valid get-policy/add/remove messages keep the existing serialized queue and asynchronous response behavior.

## Milestone 198 — Descriptor-safe cosmetic sender page identity

Cosmetic page identity now comes only from an own enumerable `sender.url`, or an own enumerable `sender.tab` containing an own enumerable `url`. Direct sender URL retains precedence. Getter-bearing/inherited/custom-prototype/array/malformed sender shapes fail before URL reads; only HTTP(S) strings continue into the existing hostname normalizer.

## Milestone 199 — Descriptor-safe cosmetic storage change routing

Cosmetic input invalidation no longer dereferences relevant storage-change keys directly. Local state/cache and session state change presence is determined through own enumerable data descriptors on ordinary/null-prototype change objects. Malformed relevant fields fail closed; unrelated changes remain ignored; valid relevant changes still invalidate inputs and serialize one refresh fanout.

## Milestone 200 — Bounded visible context-feedback statuses

Visible right-click status tracking is capped at `MAX_VISIBLE_CONTEXT_FEEDBACK = 128`. A new unique tab at capacity evicts the oldest tracked status, clears its timer, and restores the normal action title/badge. Replacing an already tracked tab does not consume another slot. The existing 128 pending-work cap and timing defaults are unchanged.

## Milestone 201 — Generation-safe context-feedback replacement

Per-tab visible status now carries a generation token. Replacement invalidates the previous generation before awaiting action-title/badge updates. An older async completion cannot install a timer over newer feedback, and stale timer callbacks reset the browser action only when their generation is still current. Capacity eviction and disposal invalidate in-flight generations as well.

## Milestone 202 — Dense bounded context-feedback policy events

`storage.onChanged` matching for committed `personalBlock` policy now snapshots the array through the shared dense enumerable-data boundary before any rule-key iteration. The existing 10,000 personal-network-rule ceiling applies to this event path. Holes, accessor indices, symbols, extra array properties, and one-over arrays fail closed without consuming pending feedback work.

## Milestone 203 — Coordinated background bootstrap teardown

`bootstrapBackground()` now captures a disposable mandatory-recovery registration when provided and exposes idempotent `disposeBackground()`. Full teardown runs optional registrations in the existing reverse order, then mandatory recovery, then the core when disposable. Failures are logged and isolated so later layers still receive teardown. Existing non-disposable core/recovery callers remain compatible, and `disposeOptionalFeatures()` remains available.

## Milestone 204 — Documentation and exact-head release-gate sync

This document and `ROADMAP.md` synchronize the development record through Milestone 204. Issue #10 remains the exact-head Chromium + Firefox release gate and PR #7 remains draft until that gate is completed on real generated browser packages.

## Validation status

The regression files added during Milestones 195–203 are **repository coverage only** in this connector-driven development session. This block does **not** claim that `npm ci`, `npm run check`, package/release verification, reproducibility, source qualification, qualification recording, or real Chromium/Firefox testing was executed or passed. Repository coverage does not satisfy Issue #10.

The privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, retained matched-element/page content, user/device identifiers, statistics database, or custom Drop Ads tracking backend was introduced.
