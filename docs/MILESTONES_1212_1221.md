# Milestones M1212–M1221 — Generated-verification admission and traversal hardening

This tranche hardens the local generated-extension verifier after the M1202–M1211 provenance work. It remains **supporting/preflight evidence only**: Issue #10 is the authoritative exact-head Chromium + Firefox runtime qualification gate. Connector-created tests/audits in this tranche were not executed locally or in browsers as part of their creation.

## M1212 — Verifier target and root admission

Generated verification accepts only exact `chromium` and `firefox` targets. Public verifier entry points resolve one non-empty root path and require that root to be a real non-symlink directory before source or generated-tree work begins.

## M1213 — Immutable verification contracts

Chromium and Firefox generated-member contracts are snapshotted once into frozen verifier-local arrays. Contract membership is bounded to 4,096 members, dense, canonical, duplicate-free, and deterministically ordered before use.

## M1214 — Canonical verifier path confinement

Source, generated-member, and `dist/<browser>` paths pass one repository-relative forward-slash path boundary capped at 1,024 UTF-8 bytes. Absolute, backslash, NUL, empty, dot, dot-dot, escaping, and normalization-alias forms fail closed before filesystem work.

## M1215 — Expected-member cardinality and collision safety

Expected generated-content construction rechecks contract cardinality, refuses duplicate expected paths, admits only Buffer values through the existing 64 MiB per-browser aggregate ceiling, and requires final expected-map cardinality to equal the frozen contract exactly.

## M1216 — Stable generated output-root pass

Each browser verification pass snapshots the real non-symlink `dist/<browser>` root through the existing bounded ancestry-identity contract before tree/member work and revalidates it before success. Output-root replacement or structural mutation during a pass therefore fails closed.

## M1217 — Locale-independent generated-tree ordering

Generated-tree traversal and returned-file ordering use an explicit direct code-unit comparator instead of locale-sensitive collation. Audit behavior and diagnostic ordering no longer depend on host locale.

## M1218 — Bounded per-directory enumeration

Generated-tree auditing uses bounded `opendir` iteration instead of whole-directory `readdir` materialization. No single directory may retain more than 4,096 entries before deterministic sorting; the existing independent aggregate entry/directory ceilings remain.

## M1219 — Final generated-tree re-audit

After generated-member comparisons and the final source re-fingerprint, the canonical generated-tree audit runs again before the stable output-root pass can finish. Late additions, removals, non-regular entries, path/type substitutions, or allowlist drift fail closed.

## M1220 — Canonical audit extension and directory identity reconciliation

The dedicated generated-verification hardening audit and generated-release integration gate protect the M1212–M1219 boundaries while preserving all historical audit markers and existing npm wiring. The traversal marker is:

`extended through M1219 generated verification traversal boundaries verified`

Generated-directory enumeration also snapshots each real non-symlink directory before bounded `opendir` iteration and revalidates device/inode/size/mtime/ctime after enumeration, before entries are sorted or consumed. The dedicated/integration audit set requires `tests/generated-tree-directory-identity-v1220.test.js`, folding this race-resistance check into the same M1220 traversal boundary.

## M1221 — Documentation and release-gate synchronization

This document, `docs/GENERATED_VERIFICATION_QUALIFICATION.md`, `ROADMAP.md`, focused roadmap regression coverage, and Issue #10 are synchronized to the M1212–M1221 tranche. The next canonical milestone is M1222.

## Privacy and qualification invariants

These changes inspect only local repository/generated-candidate bytes and filesystem metadata required for verification. They do not add telemetry, analytics, browsing/request history, page or DOM snapshots, blocked-request/action outcomes, action/accessibility names, statistics, timestamps, user/device identifiers, learned locale/profile state, credentials, or an owned Drop Ads backend. Repository tests, audits, fixtures, and generated records are supporting evidence only and do not substitute for exact-head Chromium + Firefox observations recorded under Issue #10.
