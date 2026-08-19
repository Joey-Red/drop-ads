# Milestones 709–718 — Storage and personal-policy hardening

Status: completed repository work. These changes were created through the GitHub connector in this continuation; they were not executed locally or in Chromium/Firefox here. Issue #10 remains the authoritative real-browser release gate.

## M709 — Remove ambient default-state cloning

- Replaced `structuredClone(DEFAULT_STATE)` with explicit canonical default-state construction.
- Shared default empty collections are frozen so the exported default policy cannot be mutated through nested aliases.
- Fresh state receives detached collections and the existing canonical built-in subscription set.

## M710 — Immutable normalized persisted state

- `normalizePersistedState` now returns a frozen top-level policy snapshot.
- Personal network rules are detached frozen objects with frozen resource-type arrays.
- Personal/cookie domain collections are frozen; cosmetic and subscription snapshots remain immutable.

## M711 — Descriptor-safe storage collaborators

- `api.storage`, `storage.local`, and `local.get`/`local.set` are captured with bounded descriptor-only prototype traversal.
- Accessor collaborators are rejected rather than invoked.
- Captured methods preserve their original receiver.
- State/cache reads and writes use this shared hardened boundary.

## M712 — Canonical writes

- Persisted writes still require every state field plus valid scalar types/ranges.
- After that strict admission, writes are canonicalized through the same immutable normalizer used for reads.
- Caller-owned nested rule/domain/subscription objects cannot be mutated after validation to change the storage snapshot.

## M713 — Exact state presence semantics

- Only an absent (`undefined`) state field is treated as a fresh install.
- Present malformed falsy values such as `null`, `false`, `0`, or empty text fail the persisted-state schema instead of silently resetting policy.
- The rule applies to both load and initialization paths.

## M714 — Exact cache presence semantics

- Only an absent list-cache field becomes an empty cache at the storage boundary.
- Present malformed cache values fail closed instead of being silently treated as empty.

## M715 — Immutable normalized cache snapshots

- Normalized cache envelopes and compact entries are deeply frozen before return/write.
- Pack objects, tuple/count arrays, and nested arrays are immutable.
- Freeze traversal uses the existing cache JSON node/depth ceilings and descriptor-only inspection.

## M716 — Immutable personal-policy helpers

- User-input rules return frozen normalized snapshots.
- Add/remove helpers normalize and detach existing network-rule objects before returning frozen collections.
- Resource-type arrays are frozen.
- Domain normalization and flag helpers return frozen canonical sets while preserving existing limits and ordering.

## M717 — Executable storage/state hardening gate

- Added `tools/storage-state-hardening-audit.mjs`.
- The audit rejects a return to ambient `structuredClone` default-state cloning or direct `api.storage.local.get/set` use.
- It requires bounded descriptor-safe storage collaborator capture, immutable/canonical state and cache snapshots, strict state/cache presence semantics, immutable personal-policy helpers, and the M709–M716 regression files.
- Added `storage-state-hardening-audit` to `npm run check`.

## M718 — Current-state synchronization

- This document closes the canonical M709–M718 block.
- `ROADMAP.md` advances to M719.
- Post-merge qualification/runbook/current-state audits are synchronized to include the storage/state hardening gate.
- Issue #10 remains open; repository tests/audits are preflight evidence only.

## Privacy and product invariants retained

This block adds no telemetry, analytics, browsing/request history, matched-element history, retained blocked-request statistics, user/device identifiers, page/DOM capture, custom Drop Ads backend, remote executable code, or GitHub credential handling. Firefox and Chromium continue to share the reviewed MV3 implementation path.
