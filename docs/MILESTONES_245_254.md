# Milestones 245–254 — State, response, subscription, and backup descriptor boundaries

This block extends the existing exact-object and dense-array model into state persistence, session normalization, list download configuration/results, subscription records, and settings backup import/export. The changes preserve the same privacy/product invariants and do not add telemetry, request/browsing history, identifiers, a Drop Ads backend, or new permissions.

Repository tests added in this block are regression coverage only. They were created through the GitHub connector and are **not represented as executed local validation**. Current-head `npm ci`, `npm run check`, packaging/release verification, reproducibility, source qualification, qualification-record generation, and real Chromium/Firefox behavior remain part of Issue #10.

## Milestone 245 — Detached persisted-state root snapshots

- Added `snapshotPersistedState()` as the stable own-data boundary for the persisted root.
- Every present persisted field is read through `readPlainDataField()` after exact schema validation.
- Persisted arrays are detached with the existing ceilings: 10,000 personal network rules, 5,000 cosmetics, 5,000 domains, and 128 subscriptions.
- Scalar values remain non-coercive and migration semantics remain in storage normalization.
- `assertPersistedStateBounds()` keeps its compatibility return while performing the detached validation.

## Milestone 246 — Detached persisted-state normalization and writes

- `normalizePersistedState()` now consumes a detached persisted-state snapshot instead of re-reading the original root.
- Writable state validation runs against a detached complete snapshot and preserves strict boolean/interval/cookie-mode requirements.
- `saveState()` and `saveStateAndListCache()` send detached validated state objects to browser storage rather than caller-owned objects.
- Existing default recovery, collection normalization, and storage keys remain unchanged.

## Milestone 247 — Descriptor-safe session normalization options and fields

- Session normalization no longer destructures caller options.
- Optional `strictShape` is an exact own-data boolean.
- `disabledSites` is read through the shared field boundary and dense-snapshotted at the existing 5,000-domain limit.
- Session storage result extraction is descriptor-safe.
- Non-strict migration fallback and strict write behavior remain unchanged.

## Milestone 248 — Descriptor-safe list timeout options

- `timeoutMs`, timer implementations, and `AbortControllerImpl` are read through `readPlainDataField()` after exact option validation.
- Omitted values retain the 30-second default and platform timer/AbortController implementations.
- The existing 1–120,000 ms timeout bound, abort race, and final timer cleanup remain unchanged.

## Milestone 249 — Detached subscription field normalization

- Subscription `id`, `title`, `format`, `sourceUrl`, `enabled`, and `builtIn` are detached before semantic normalization.
- Required fields remain mandatory; optional booleans remain strict and retain omission defaults.
- Public HTTPS admission, credential rejection, 4,096 raw / 4,000 canonical URL limits, built-in behavior, and source-key semantics remain unchanged.

## Milestone 250 — Descriptor-safe response read options and stream results

- Optional bounded-reader `signal` is read through the shared own-data boundary.
- Stream reader results are exact `{done,value?}` own-data envelopes.
- `done` must be boolean; nonterminal `value` must be `Uint8Array`; terminal results may omit `value` or provide only `undefined`.
- Malformed results retain best-effort reader cancellation while the existing byte, UTF-8, and abort behavior stays intact.

## Milestone 251 — Detached cache-creation policy fields

- Cache creation detaches `block`, `allow`, optional cosmetic arrays, and optional `sourceKey` before dense snapshots/encoding.
- `block` and `allow` remain required.
- All four policy arrays retain the shared 300,000 total raw item ceiling.
- Schedule validation and versioned cache encoding semantics are unchanged.

## Milestone 252 — Detached settings-backup root and settings snapshots

- Backup root and nested settings/state objects are copied through exact descriptor-safe snapshots before import/export semantics.
- Export still requires the full reviewed state shape.
- Older version-1 backups may still omit the two cosmetic arrays and recover them as empty arrays on import.
- The 1 MB backup bound, collection ceilings, strict scalars, and privacy-safe exported content remain unchanged.

## Milestone 253 — Detached settings-backup subscription records

- Every bounded imported subscription record is detached before built-in/external discrimination.
- Built-ins remain exact `{id, enabled?}` records.
- External records remain exact `{title, format, sourceUrl, enabled?}` records.
- Optional `enabled` remains strict when present and defaults enabled when omitted.
- Canonical built-in IDs, generated external import IDs, public HTTPS normalization, 128-record limit, and dedupe semantics remain unchanged.

## Milestone 254 — Documentation and exact-head gate synchronization

- This document and `ROADMAP.md` synchronize the hardening record through Milestone 254.
- Draft PR #7 is updated to point to the latest milestone block without hardcoding a branch SHA.
- Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.
- No qualification checkbox is checked by this repository-only work.

## Release status

PR #7 must remain draft until Issue #10 is completed against one exact packaged head. Any subsequent source commit invalidates prior browser observations. GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state; that condition is neither a successful qualification nor a product failure.
