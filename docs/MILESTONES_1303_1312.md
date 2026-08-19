# Milestones 1303–1312 — Generated-verification audit identity/limits hardening

This tranche is **source-only supporting evidence**. It does not create, import, infer, or retain Chromium/Firefox observation state. **Issue #10 remains the authoritative exact-head browser qualification gate.**

## M1303 — Exact filesystem identity tuple resnapshotting

Published frozen filesystem identity tuples are descriptor-resnapshotted before comparison. The exact reviewed `dev`, `ino`, `mode`, `nlink`, `size`, `mtimeMs`, and `ctimeMs` surface is required; extra/symbolic/custom/accessor-backed evidence fails closed without getter execution.

## M1304 — Exact ancestry inventories

Generated-verification source ancestry is published and revalidated through a dense exact frozen descriptor-snapshotted inventory capped at the existing 64-directory ceiling. Holes, extra/symbolic fields, accessors, malformed entries, and iterator-dependent shapes fail closed.

## M1305 — Repository-root snapshot binding

Repository-root evidence is an exact frozen own-data `{ path, state }` result. The root path remains absolute and normalized, the reviewed identity tuple is resnapshotted, and opening/closing root observations must preserve both the exact path and filesystem identity.

## M1306 — Canonical audit limits

`tools/generated-verification-audit-limits.mjs` is the immutable reviewed limit authority: 1,024 path bytes, 1 MiB source bytes, 64 ancestry entries, 64 audit-contract entries, and 32 privacy matcher rules. Limit publication is descriptor-safe and exact.

## M1307 — Shared limit binding

Audit I/O derives path/source/ancestry ceilings from the canonical limit contract. Audit inventory admission derives source/cardinality ceilings from the same authority and uses the shared source-byte-ceiling validator. Independent numeric authority at those boundaries was removed while historical failure semantics were preserved.

## M1308 — Exact source-result resnapshotting

`tools/generated-verification-audit-source-result.mjs` publishes the shared exact resnapshot boundary for frozen own-data `{ path, source, bytes }` results. Canonical repository-relative path admission and UTF-8 byte consistency are revalidated before later audit consumption.

## M1309 — Resnapshotted audit consumers

Qualification-guidance, privacy-surface, generated-verification hardening, result-contract, and audit/preflight-hardening source reads are resnapshotted before `.path`, `.source`, or `.bytes` evidence is consumed. Privacy source-result inventory validation now reuses the shared source-result contract.

## M1310 — Privacy matcher cardinality binding

The privacy matcher inventory's 32-rule ceiling now derives from `GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRules`. Exact-native/stateless matcher semantics, bounded labels/patterns, captured `RegExp.prototype.test` execution, and the historical privacy result marker remain unchanged.

## M1311 — Composed hardening integration

The bounded audit/preflight hardening gate now requires the complete M1303–M1310 source/regression chain, including the canonical limits and source-result modules. Stale pre-refactor source markers were reconciled while the historical M1261 result object and all prior integration/closeout markers remained unchanged. Source-only integration marker: `canonical M1311 generated verification audit identity/limits hardening tranche integrated`.

## M1312 — Closeout synchronization

The tranche is synchronized into this canonical milestone record, generated-verification result-qualification guidance, the bounded audit/preflight hardening gate, `ROADMAP.md`, and Issue #10 supporting evidence. Closeout marker: `canonical M1312 generated verification audit identity/limits hardening closeout verified`.

## Preserved invariants

- No repository/source audit result is a browser observation or browser qualification pass.
- Chromium and Firefox observations must still be performed against the same exact source head/fingerprint/package evidence through Issue #10.
- Generated-verification audit work remains bounded, root-confined, regular-file-only, non-symlink, strict UTF-8, identity-stable, descriptor-safe, and fail-closed.
- Exact frozen success/result contracts preserve their historical marker values unless a dedicated milestone explicitly changes the public contract.
- No telemetry, analytics, browsing/request history, page/DOM snapshots, action/click history, retained statistics, timestamps, user/device identifiers, embedded GitHub credentials/tokens, or owned Drop Ads backend behavior is introduced.

Connector-created regressions in this tranche are repository source changes only; they are not represented here as having been executed locally or in either browser.
