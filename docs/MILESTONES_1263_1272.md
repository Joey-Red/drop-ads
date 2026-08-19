# Milestones 1263–1272 — Generated-verification audit contract/preflight hardening

This tranche hardens source-only generated-verification qualification support. It does **not** create browser evidence: Issue #10 remains the authoritative exact-head browser qualification gate for real Chromium and Firefox observations.

## M1263 — Descriptor-safe audit contract entries

Generated-verification audit inventories consume only exact frozen plain own-data `{ path, maxBytes }` entries. Accessors, symbols, extra/missing keys, arrays, custom prototypes, unfrozen objects, malformed paths, and invalid byte ceilings fail before values are consumed.

## M1264 — Dense exact audit inventories

Audit inventories are snapshotted from indexed own data descriptors rather than iterators. Holes, accessor elements, extra string/symbol properties, own iterator overrides, empty inventories, and inventories above 64 entries fail closed.

## M1265 — Deterministic audit contract ordering

Validated audit entries are frozen in direct code-unit path order. Caller insertion order and host locale cannot change the canonical source inventory; duplicate canonical paths still fail before publication.

## M1266 — Final pathname identity revalidation

Bounded opened-handle audit reads now re-`lstat` the final repository pathname after reading and strict UTF-8 decoding. A rename, replacement, symlink substitution, or other final-path identity/type change fails before ancestry/root validation can succeed.

## M1267 — Stronger filesystem identity tuple

Audit root, ancestry, opened file, and final pathname identity checks compare device, inode, mode, hard-link count, size, mtime, and ctime. Permission/type-bit or link-topology drift is therefore part of the fail-closed identity boundary.

## M1268 — Bounded privacy diagnostics

Generated-verification privacy-surface findings use one bounded recorder capped at 128 retained violations. The first attempted diagnostic beyond that ceiling fails immediately rather than growing error output without bound.

## M1269 — Complete privacy result contract

A successful privacy audit must cover the complete canonical source contract in exact order with a safe aggregate byte count. Its file inventory is copied/frozen and the historical M1244 marker remains stable; a partial/reordered scan cannot be represented as success.

## M1270 — Descriptor-safe preflight child markers

Composite preflight snapshots each child audit `marker` from an own data descriptor instead of live property access. Accessor-backed markers are rejected without getter execution, and accepted text inherits the existing 512-byte, well-formed NFC, control-free marker contract.

## M1271 — Audit/preflight hardening result binding

Composite preflight now consumes the M1261 audit/preflight-hardening result and requires its exact canonical integration marker. The marker is a gate only: the published preflight input/result shape remains unchanged so no new persisted or browser-like evidence is manufactured.

## M1272 — Closeout synchronization

The M1263–M1272 regression chain, qualification guidance, bounded hardening audit, roadmap history, and Issue #10 supporting-evidence note are synchronized. Historical result markers remain compatible and browser observations remain separate.

## Privacy and evidence invariants

- Zero telemetry, analytics, browsing/request history, page/DOM/click history, retained statistics, timestamps, identifiers, or owned Drop Ads backend behavior is introduced.
- Audit/preflight tooling reads reviewed local source only and retains no browser/session/site observation state.
- Source audits, generated records, fixtures, and regression files are supporting preflight evidence only.
- Real Chromium and Firefox qualification must be performed on the same exact packaged head and recorded through Issue #10.
