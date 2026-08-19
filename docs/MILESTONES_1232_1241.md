# Milestones 1232–1241 — Generated-verification contract/result hardening

This tranche hardens the local generated-extension verification boundary without adding telemetry, tracking, browsing/request history, retained action outcomes, identifiers, language/profile state, or an owned backend. Repository tests, audits, fixtures, and generated records remain **supporting/preflight evidence only**. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.

## M1232 — Descriptor-safe verifier contract snapshots

Generated-verifier browser contracts are admitted through bounded own-key/own-descriptor inspection before values are consumed. Only an own data `length` plus exact dense canonical numeric indices are accepted; holes, accessors, symbols, extra keys, malformed indices, non-string values, or membership above 4,096 fail closed. The copied contract is frozen before path validation.

## M1233 — Canonical Unicode verifier paths

Verifier contract/source/output/result paths require primitive well-formed NFC Unicode, reject C0/C1 controls plus zero-width/BOM/bidi control text, and pass one canonical repository-relative forward-slash boundary capped at 1,024 UTF-8 bytes. Absolute, backslash, NUL, empty, dot, dot-dot, normalization-alias, and root-escaping forms fail closed.

## M1234 — Canonical audit through M1233

The generated-verification hardening and generated-release integration audits protect the descriptor-safe verifier contract, canonical Unicode/path boundary, stable verification-pass/root state, late generated-tree re-audit, and post-pass source-state re-fingerprint while preserving every historical compatibility marker.

## M1235 — Immutable generated-tree membership

Generated-tree file/directory membership is retained only as frozen sorted arrays from the reviewed browser allowlist snapshots. Membership lookup uses deterministic code-unit binary search rather than mutable module-local `Set` state. Existing descriptor-safe allowlist admission, Unicode/path checks, directory/subtree/root identity revalidation, and traversal ceilings remain intact.

## M1236 — Descriptor-safe build-info mapping

The verifier snapshots `buildInfo.inputs` through the canonical `snapshotBuildFingerprintInputs` validator before constructing its source-descriptor map. Generated-source membership and byte/SHA-256 provenance checks therefore consume only bounded canonical frozen `{path, bytes, sha256}` descriptors rather than live caller property iteration.

## M1237 — Canonical audit through M1236

The dedicated generated-verification audit and generated-release integration gate protect the M1232–M1236 structural boundaries while retaining all prior M1152+, M1202+, M1212+, and M1222+ compatibility markers. `npm run check` continues to reach the generated-release integration gate through the existing single wiring path.

## M1238 — Exact generated contract parity and browser delta

A bounded source-only consistency audit compares the frozen generated-tree allowlist and generated-verifier contract for Chromium and Firefox. Member count, deterministic order, text, and UTF-8 byte identity must agree exactly for each browser. The cross-browser delta is locked to one reviewed Firefox-only member: `rules/static.json`; Chromium must exclude it, Firefox must contain it exactly once, and removing that member from Firefox must leave the exact Chromium contract.

## M1239 — Frozen verification result contracts

Browser verification succeeds only through a frozen result contract with exact browser identity, a frozen bounded canonical file array, and a canonical lowercase 64-character SHA-256 source fingerprint. Paired verification requires frozen canonical Chromium/Firefox child results whose fingerprints exactly equal the shared source fingerprint, then returns one frozen pair object. Result publication stores no observation history or user data.

## M1240 — Integrated contract/result auditing

The generated-release integration gate now invokes both the generated contract-consistency audit and generated-verification result-contract audit in addition to the historical hardening audit. The result audit protects frozen browser/pair shapes, canonical result paths, canonical lowercase SHA-256 fingerprints, shared-fingerprint equality, and absence of network/telemetry surfaces. Legacy result regressions were reconciled to canonical fingerprint publication. The integration gate adds `extended through M1240 generated verification contract/result boundaries verified` without adding a second npm traversal.

## M1241 — Documentation, roadmap, and qualification synchronization

This document, `docs/GENERATED_VERIFICATION_QUALIFICATION.md`, `ROADMAP.md`, a focused roadmap regression, and the Issue #10 supporting-evidence delta are synchronized to the canonical M1232–M1241 state. The next canonical milestone number is 1242.

## Privacy and evidence boundary

Generated verification may inspect only reviewed local repository inputs, generated candidate files, and filesystem metadata needed to prove candidate identity. It must not retain telemetry, analytics, browsing/request history, page or DOM snapshots, blocked-request/action outcomes, action or accessibility names, consent context, statistics, timestamps, user/device identifiers, locale/profile state, credentials, or owned Drop Ads backend data.

A successful source-only audit, build, package, or generated-verification pass is not a Chromium or Firefox runtime pass. Exact-head browser observations must still be recorded through Issue #10, and prior browser evidence must not be carried forward across a changed exact head.
