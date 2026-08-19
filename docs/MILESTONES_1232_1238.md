# Milestones 1232–1238 — Generated-verification structural hardening

This tranche continues the generated-verification hardening documented in `docs/MILESTONES_1222_1231.md`. All repository tests, source audits, filesystem checks, and generated-candidate comparisons described here are **supporting/preflight evidence only**. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.

## M1232 — Descriptor-safe verifier contract admission

Generated browser-member contract arrays are snapshotted through bounded own-key/own-descriptor inspection before any member value drives verification. The source must be dense and field-exact with only `length` plus canonical numeric indexes; holes, accessors, symbols, extra keys, malformed indexes, and non-string values fail closed. Existing 4,096-member, canonical-path, duplicate, deterministic-order, and frozen-snapshot rules remain.

## M1233 — Canonical Unicode verifier paths

Verifier repository-relative paths must be primitive, well-formed Unicode already in NFC form and must not contain C0/C1, zero-width/BOM, bidi-control, or related invisible control text. These checks occur before the existing 1,024-byte UTF-8 ceiling, slash/dot-segment checks, and root-confinement resolution.

## M1234 — Canonical audit coverage through M1233

The dedicated generated-verification hardening audit and generated-release integration gate were extended to protect the descriptor-safe verifier-contract boundary, canonical Unicode path boundary, post-pass source re-fingerprint, and supporting output/subtree identity checks while preserving historical compatibility markers and existing npm/preflight wiring.

## M1235 — Immutable generated-tree membership

Per-browser generated-tree file and directory membership is retained as immutable sorted arrays derived from the reviewed allowlist snapshot. Runtime membership checks use deterministic code-unit binary search rather than retaining mutable `Set` membership state. Transient bounded sets used only while constructing snapshots or collecting one audit result do not become persistent browser/path membership state.

## M1236 — Descriptor-safe build-info mapping

The verifier no longer iterates live `buildInfo.inputs` directly. It calls the canonical `snapshotBuildFingerprintInputs` validator first and constructs its descriptor map only from the bounded canonical `{path, bytes, sha256}` snapshot. Duplicate refusal plus source-membership, byte-length, and SHA-256 checks remain after admission.

## M1237 — Generated-verification structural audit closeout

The dedicated and generated-release integration audits now protect the combined structural boundary through M1236: descriptor-safe generated allowlist/verifier-contract/build-input snapshots, full-subtree directory identity, post-pass source re-fingerprinting, and well-formed NFC/control-free verifier paths. Historical markers remain and the new compatibility marker is `extended through M1236 generated verification structural boundaries verified`.

## M1238 — Documentation, roadmap, and Issue #10 synchronization

This document, `docs/GENERATED_VERIFICATION_QUALIFICATION.md`, `ROADMAP.md`, and the Issue #10 supporting-evidence delta are synchronized to the completed tranche. The next canonical milestone is M1239.

## Privacy and evidence boundary

Generated verification is local-only. It must not retain telemetry, analytics, browsing/request history, page/DOM snapshots, blocked-request/action outcomes, action/accessibility names, consent context, statistics, user/device identifiers, locale/profile state, credentials, or owned Drop Ads backend data.

Connector-created tests and audits in this tranche were not executed locally or in browsers during the milestone-writing workflow. Their presence is not a Chromium or Firefox runtime pass and does not replace the exact-head Issue #10 observation process.
