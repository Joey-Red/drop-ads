# Milestones 1253–1262 — Generated-verification audit/preflight hardening

This tranche hardens the source-only generated-verification audit and preflight boundary. It does **not** create Chromium or Firefox runtime evidence. Issue #10 remains the authoritative exact-head browser qualification gate.

## M1253 — Real repository-root identity

Generated-verification audit reads require a real non-symlink repository root and revalidate its device, inode, size, mtime, and ctime after the bounded source read.

## M1254 — Source ancestry identity

Every parent directory from the repository root to the audited file is bounded to 64 levels, must be a real non-symlink directory, and is revalidated after source I/O.

## M1255 — Canonical Unicode audit paths

Audit source paths are repository-relative forward-slash paths capped at 1,024 UTF-8 bytes. They must be well-formed NFC Unicode and reject C0/C1, zero-width, BOM, and bidi control text before filesystem resolution.

## M1256 — Validated immutable audit contract

The shared audit contract uses the same canonical path admission as runtime audit reads, validates per-source byte ceilings, freezes entries/inventories, and rejects duplicate privacy-source paths.

## M1257 — Descriptor-safe preflight inputs

The frozen preflight-result constructor snapshots exactly four reviewed marker fields from a plain own-data object. Arrays, custom prototypes, symbols, extras, accessors, missing fields, and getter-backed values fail closed before marker values are consumed.

## M1258 — Canonical preflight marker text

Child preflight markers remain capped at 512 UTF-8 bytes and now also require well-formed NFC Unicode while rejecting C0/C1, zero-width, BOM, and bidi controls.

## M1259 — Bounded opened-handle source reads

Audit I/O no longer uses whole-file `handle.readFile()`. It reads through a `maxBytes + 1` bounded buffer so concurrent source growth cannot cause unbounded allocation before the ceiling check.

## M1260 — Expanded privacy review

The generated-verification privacy-source inventory now covers the shared audit I/O, immutable audit contract, qualification-guidance audit, and preflight support stack in addition to the verifier/pass/result sources. The privacy matcher source remains intentionally excluded from self-scanning its own forbidden-pattern literals.

## M1261 — Composed audit/preflight gate

`generated-verification-audit-preflight-hardening-audit.mjs` locks the M1253–M1260 markers and regression chain. `auditGeneratedVerificationPreflight` executes it before the existing hardening/result/guidance/privacy checks, and the generated-release integration already executes that preflight path.

## M1262 — Closeout synchronization

This document, the exact-head generated-verification qualification guide, the closeout regression, canonical milestone pointer, and Issue #10 supporting-evidence comment synchronize the tranche. Source-only checks remain supporting evidence and never substitute for real browser observations.

## Preserved invariants

- Zero telemetry, analytics, browsing/request history, DOM/page snapshots, retained statistics, or user/device identifiers.
- No custom Drop Ads backend is introduced.
- No browser qualification pass is inferred from repository tests, source audits, fixtures, or frozen marker objects.
- Chromium and Firefox evidence must remain bound to the same exact source head/fingerprint under Issue #10.
