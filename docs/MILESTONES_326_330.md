# Milestones 326–330 — Core/content collaborator completion

This block closes several descriptor, collaborator, and content-style validation gaps without changing Drop Ads policy semantics, permissions, or privacy posture.

## Milestone 326 — Contain revoked Proxy core schema boundaries

The shared core object-schema helpers now contain revoked-Proxy failures that can occur during `Array.isArray()` before prototype/descriptor inspection begins.

- `readPlainDataField()` returns its existing unsafe-field result for revoked object or array proxies instead of leaking the native exception.
- `assertPlainExactObject()` converts revoked roots into deterministic schema errors.
- `snapshotDenseDataArray()` converts revoked array/object proxies into deterministic dense-array errors.
- Ordinary objects, null-prototype objects, normal dense arrays, symbol/accessor rejection, and existing collection ceilings are unchanged.

Focused repository coverage: `tests/object-schema-revoked-proxy-v326.test.js`.

## Milestone 327 — Unify cosmetic runtime descriptor snapshots

The optional cosmetic runtime now uses the shared core field boundary instead of maintaining a second local descriptor reader.

- exact runtime option, policy-build input, and per-action message envelopes are detached before use;
- sender URL and storage-change discrimination use `readPlainDataField()`;
- message dispatch does not reread caller-controlled fields through normal property access;
- changing descriptors and revoked roots fail through the shared deterministic boundary;
- the existing **5,000 disabled-site** bound, message schemas, policy precedence, lifecycle/idempotence, and fanout behavior remain unchanged.

Focused repository coverage: `tests/cosmetic-runtime-shared-fields-v327.test.js`.

## Milestone 328 — Bound cosmetic runtime logger and error collaborators

Supplied cosmetic runtime collaborators no longer require normal property reads after installation.

- a supplied logger must provide `warn` as an ordinary/null-prototype enumerable own data field;
- the warning function is captured before listener registration and reused without rereading `logger.warn`;
- omitted logger behavior still delegates to `console.warn`;
- user-visible cosmetic runtime failure replies read only an own-data `message` string and retain at most **1,024 characters**;
- accessors, hostile descriptors, oversized messages, and unsupported thrown values fall back to the reviewed action-specific error text.

Focused repository coverage: `tests/cosmetic-runtime-collaborators-v328.test.js`.

## Milestone 329 — Enforce canonical cosmetic stylesheet response grammar

The content-side cosmetic policy response boundary now verifies that a positive stylesheet is exactly representable by the reviewed declarative serializer before assigning it to the extension-owned `<style>` node.

- zero selectors require an empty stylesheet;
- positive responses must use selectors separated by `,\n` followed by exactly ` { display: none !important; }\n`;
- the parsed selector count must equal `selectorCount` and duplicate selectors are rejected;
- each selector retains the existing **512-character** and printable-ASCII/declarative safety rules;
- the existing **2,048-selector / 256 KiB UTF-8 stylesheet** ceilings remain unchanged;
- malformed formatting, unsafe selectors, or count mismatches fail closed through the existing stale-style removal path.

Focused repository coverage: `tests/content-cosmetic-stylesheet-grammar-v329.test.js`. The earlier M324 positive fixture was updated to use canonical serializer output.

## Milestone 330 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. Issue #10 remains the authoritative clean exact-head Chromium + Firefox qualification gate, and PR #7 remains draft until that matrix is performed against the same packaged head.

## Validation statement

The M326–330 regression files and repository changes described here are **repository coverage only**. No `npm` checks, packaging, reproducibility verification, source qualification, or Chromium/Firefox runtime qualification were executed or claimed by these connector-only changes.

This block adds no telemetry, analytics, browsing/request history, matched-element history, statistics database, identifiers, custom Drop Ads backend, new permission, or executable remote-code path.
