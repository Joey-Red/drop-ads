# Milestones 669–678 — Source diagnostic and canonical report hardening

This block continues the post-merge source-qualification hardening line. All repository tests, audits, source qualification output, and generated records remain **preflight evidence only**. Issue #10 remains the authoritative real Chromium + Firefox runtime qualification gate.

## M669 — Restore native HEAD response diagnostics

`tools/source-head-response.mjs` now supports real Fetch `Response` and `Headers` objects through captured native prototype accessors/methods. Native values are read receiver-preservingly instead of assuming `ok`, `redirected`, `headers`, or `get` are own data properties. Synthetic test collaborators remain supported.

## M670 — Fail closed on injected HEAD response shapes

Synthetic HEAD response and header collaborators must be exact plain enumerable data objects. Accessors, symbols, extra fields, custom prototypes, and unsafe inspection are rejected without invoking caller getters. The native Fetch intrinsic path remains separate.

## M671 — Canonicalize network rules in source summary snapshots

Successful source block/allow rules are normalized during summary admission rather than later aggregation. Canonical rule objects are copied and frozen, including frozen `resourceTypes` arrays, so summary work does not retain caller-owned network-rule objects.

## M672 — Canonicalize cosmetic rules in source summary snapshots

Successful cosmetic hide/allow rules are likewise normalized during summary admission. Canonical cosmetic objects and nested `domains` / `excludedDomains` arrays are copied and frozen before aggregation.

## M673 — Bound HEAD declared-byte diagnostics to download limits

Optional HEAD `Content-Length` metadata is retained only when it is at or below the same `MAX_REMOTE_LIST_BYTES` ceiling enforced by the authoritative GET path. Oversized HEAD metadata becomes unavailable (`null`) and does not change the source qualification outcome.

## M674 — Enforce per-source report rule ceilings

Each successful source report row must fit the authoritative `MAX_REMOTE_SUPPORTED_RULES` ceiling across its combined network and cosmetic supported-rule counts. Report validation therefore cannot represent a source policy larger than the parser admits.

## M675 — Enforce report declared-byte ceilings

Successful report `declaredBytes` values must be `null` or within the authoritative `MAX_REMOTE_LIST_BYTES` range. Impossible oversized diagnostic metadata is rejected at the report boundary.

## M676 — Isolate report serialization from prototype hooks

Validated source reports are copied into a deterministic null-prototype serialization snapshot before JSON output. Inherited `Object.prototype.toJSON` and `Array.prototype.toJSON` hooks cannot alter or observe report serialization. The existing 128 KiB output ceiling remains authoritative.

## M677 — Enforce the expanded hardening contract

`tools/source-qualification-hardening-audit.mjs` now checks the native/injected HEAD response boundary, canonical deep-frozen network/cosmetic policy snapshots, shared HEAD/report byte and rule ceilings, and prototype-hook-isolated report serialization. The audit remains part of `npm run check`.

## M678 — Synchronize current qualification state

The roadmap, post-merge qualification state, exact-head runbook, current-state audit, and Issue #10 guidance are synchronized to M669–M678. The next canonical milestone is M679.

## Evidence boundary

These M669–M678 code, tests, audits, and documentation changes were created through the repository connector in this continuation. They were not executed locally and were not exercised in Chromium or Firefox here. They do not constitute browser qualification or release qualification.

The project invariants remain unchanged: no telemetry, analytics, browsing/request history, matched-element history, retained blocked-request statistics, user/device identifiers, or owned Drop Ads backend.
