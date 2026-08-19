# Milestones 144–153 — Dense arrays, remote byte/time boundaries, and storage-read hardening

This block continues Drop Ads' browser-local privacy and reliability hardening. It adds no telemetry, browsing/request history, retained page or DOM history, identifiers, statistics database, new permissions, remote executable code, or Drop Ads backend.

## 144 — descriptor-safe dense array snapshots

- one shared array boundary now validates dense own enumerable data entries without invoking getters
- holes, symbols, extra properties, accessor indices, and non-enumerable indices fail closed
- array work is capped before entry reads and callers receive a detached index snapshot

## 145 — descriptor-safe network cache pack arrays

- compact `d`, `u`, `p`, and resource-scoped `r` arrays are dense-data validated before iteration
- resource-scoped tuples are exact three-entry arrays
- cached `resourceTypes` arrays inherit the core 16-entry raw ceiling before rule normalization

## 146 — descriptor-safe cosmetic cache arrays and integrity counts

- compact cosmetic hide/allow packs and scoped cosmetic tuples are dense-data validated
- cosmetic domain/exclusion arrays inherit the core 64-domain ceiling
- v4/v5 integrity count vectors are exact dense four-entry non-negative integer arrays

## 147 — strict remote response byte metadata

- `Content-Length` is accepted only as a non-negative safe-integer decimal string
- malformed/coercion-bearing length metadata fails before body consumption
- fallback bodies must actually be strings and streamed chunks must be `Uint8Array`
- the existing 5,000,000-byte ceiling and fatal UTF-8 decoding remain in force

## 148 — exact bounded list-download timeout configuration

- injected timeout options use an exact descriptor-safe data schema
- timeout configuration is bounded to 1–120,000 ms with the existing 30,000 ms default
- invalid option objects fail before timers or download tasks start

## 149 — strict finite cache schedule creation

- cache schedule creation accepts only finite non-negative numeric clock/delay inputs
- coercion objects and numeric strings are rejected without conversion hooks
- refresh deadlines cannot overflow the JavaScript safe-integer range
- the intentional bundled `(0, 0)` immediate-due cache remains supported

## 150 — non-coercive refresh-due evaluation

- refresh checks no longer coerce caller-supplied clock values
- invalid, unsafe, string, or object clocks are treated conservatively as due
- valid current/exact-due/far-future behavior and the eight-day deferral guard remain unchanged

## 151 — non-coercive persisted scalar recovery

- persisted booleans are accepted only as booleans; corrupt/missing values recover to reviewed defaults
- update interval accepts only an actual finite number from 1 through 168
- cookie mode accepts only a reviewed mode string
- legacy omitted fields remain migratable through defaults

## 152 — descriptor-safe persisted collection arrays

- persisted personal network/cosmetic, site-domain, cookie-exception, and subscription arrays are dense-data validated before normalization or writes
- existing 10,000 / 5,000 / 5,000 / 128 raw collection ceilings remain unchanged
- holes/accessors/symbols/extra properties fail before dedupe or policy activation

## 153 — descriptor-safe storage read envelopes

- `storage.local.get()` results used by state/cache initialization are exact ordinary/null-prototype data envelopes for the requested key
- inherited, accessor, symbol, array, custom-prototype, and unexpected fields fail before stored values are read
- missing requested keys retain the reviewed default-state / empty-cache behavior

## Release status

Repository coverage added by these milestones is preflight only. Issue #10 remains the real exact-head Chromium + Firefox release gate, and PR #7 remains draft. Any prior qualification record is invalid after the development head changes; no browser-pass claim is made by this milestone block.
