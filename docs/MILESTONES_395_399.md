# Milestones 395–399 — Runtime-message boundary hardening

This block tightens the browser-internal runtime-message admission layer without expanding permissions, retention, network scope, or background capabilities. It does not add telemetry, analytics, browsing/request history, identifiers, or a Drop Ads backend.

## Milestone 395 — Explicit refresh-force presence semantics

`drop-ads:refresh-lists` now distinguishes an omitted optional `force` field from a present field whose value is `null` or `undefined`.

- omission remains valid and means a normal non-forced refresh
- an own present `force` field must be a primitive boolean
- strings, numbers, boxed booleans, objects, proxies, `null`, and explicit `undefined` fail before the guarded core listener receives the message
- exact message-key handling and normal `true` / `false` behavior are unchanged

Repository coverage: `tests/message-refresh-force-v395.test.js`.

## Milestone 396 — Backup character preflight before UTF-8 allocation

Import-settings message validation retains the existing `MAX_SETTINGS_BACKUP_BYTES` UTF-8 byte ceiling, but now rejects an input whose JavaScript code-unit length already exceeds that ceiling before creating the encoded byte array.

- exact-bound ASCII input still reaches the authoritative UTF-8 byte check
- multibyte input still fails when its encoded byte length exceeds the existing ceiling
- the boundary does not truncate, normalize, inspect, or retain backup contents

Repository coverage: `tests/message-backup-preflight-v396.test.js`.

## Milestone 397 — Bounded descriptor-only guard failure text

Guarded runtime-message validation no longer serializes caught failures with `instanceof Error` or a normal `.message` read.

- only an own data `message` descriptor may contribute failure detail
- accepted detail must be a non-empty string of at most **1,024 characters**
- accessor, proxy-descriptor, missing, type-confused, or oversized message data falls back to reviewed static text
- rejected message payload contents are not appended to the guard response
- group routing and `rejectUnknown` behavior are unchanged

Repository coverage: `tests/message-guard-error-v397.test.js`.

## Milestone 398 — Runtime-message type discriminator bound

Runtime message types now have an explicit **64-character** ceiling, comfortably above every shipped Drop Ads core/cosmetic message literal.

- empty and over-limit types fail before action-specific validation
- over-limit type sniffing fails before known-type set routing
- unknown/over-limit rejection text is static and does not echo attacker-controlled type strings
- all existing core/cosmetic message names and group routing remain unchanged

Repository coverage: `tests/message-type-bound-v398.test.js`.

## Milestone 399 — Documentation and exact-head release-gate synchronization

This document and `ROADMAP.md` synchronize the runtime-message boundaries above. Draft PR #7 remains intentionally draft, and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

Connector-created or connector-edited regression coverage in this block is repository coverage only. No `npm ci`, test/check/package/release/reproducibility/source-qualification command, generated package validation, or real Chromium/Firefox qualification is claimed as executed by this work.
