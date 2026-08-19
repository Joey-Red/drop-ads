# Milestones 1222–1231 — Generated-verification identity hardening

This tranche hardens generated extension verification against mutable generated membership, browser-tree replacement, and verification-pass identity drift. These repository checks are supporting/preflight evidence only; Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1222 — Immutable generated-tree allowlist snapshots

`tools/artifact-audit.mjs` snapshots bounded Chromium/Firefox generated-file membership into immutable module-load allowlists and local membership sets. Tree traversal no longer consults live generated-contract membership while an audit is in progress.

## M1223 — Whole-tree generated root identity

The generated browser root is snapshotted before traversal and revalidated after recursive enumeration and required-member checks. Root replacement or structural mutation across the complete standalone tree audit fails closed in addition to per-directory enumeration checks.

## M1224 — Structured verification root identity state

Generated-verification pass `rootIdentity` is admitted only as an exact frozen own-data object containing size/time/device/inode identity with validated numeric semantics. Accessors, mutable descriptors, extra keys, and malformed metadata fail closed before finish-time use.

## M1225 — Pre-ancestry output-root revalidation

Before ancestry revalidation, the generated output root is re-lstat'd as a real non-symlink directory and required to match the start-of-pass identity.

## M1226 — Post-ancestry output-root revalidation

After ancestry revalidation, the output root is checked again against the same start-of-pass identity so replacement or mutation during ancestry finish cannot be accepted.

## M1227 — Verification ancestry sentinel confinement

The ancestry sentinel is one reviewed child name beneath the admitted output root. Resolution must remain exactly that child and cannot alias or escape the verification root before ancestry capture.

## M1228 — Immutable verification pass fields

Top-level `distDirectory`, `ancestry`, and `rootIdentity` pass fields are consumed only through enumerable, non-writable, non-configurable own data descriptors. The pass remains exact-field and frozen before filesystem work.

## M1229 — Canonical identity hardening audit

The dedicated generated-verification hardening audit and generated-release integration gate protect the canonical M1222–M1228 tree/pass identity boundaries while preserving historical M1158/M1209/M1219 markers and existing npm/preflight wiring. `tests/build-generated-verification-hardening-audit-v1229.test.js` protects the joined identity boundary. Concurrent ancestry-binding work remains compatible supporting hardening rather than a second M1229 allocation.

## M1230 — Bind pass ancestry to its exact output root

Finish-time pass admission proves the frozen ancestry snapshot is rooted at the exact `distDirectory` carried by the same pass before filesystem revalidation. The ancestry root entry and its `path` are consumed through own data descriptors; empty, accessor-backed, non-frozen, noncanonical, or mismatched-root state fails closed. `tests/generated-verification-pass-ancestry-root-v1230.test.js` is the canonical regression for this milestone. Existing pass-binding audit markers remain supporting compatibility evidence.

## M1231 — Documentation, roadmap, and qualification sync

This document, `docs/GENERATED_VERIFICATION_QUALIFICATION.md`, `ROADMAP.md`, the focused roadmap regression, and the Issue #10 supporting-evidence delta are synchronized. `ROADMAP.md` advances the sole canonical allocation pointer to M1232. Repository/source checks do not claim Chromium or Firefox runtime qualification.

## Compatible supporting hardening

Concurrent work also strengthened generated path Unicode/control-text rejection, descriptor-safe generated allowlist source admission, full ancestry-state descriptor validation, and root metadata admission. Those protections remain in the implementation and audits as supporting hardening without creating duplicate canonical allocations inside M1222–M1231.

## Privacy and qualification boundary

Nothing in M1222–M1231 adds telemetry, tracking, browsing/request history, identifiers, retained generated-file observations, action outcomes, statistics, timestamps, or user-profile state. Repository tests, audits, fixtures, generated records, and documentation do not substitute for exact-head Chromium + Firefox observation under Issue #10.
