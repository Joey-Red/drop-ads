# Milestones 180–184 — cache serialization and import-boundary hardening

This block continues the fail-closed boundary work without changing Drop Ads' privacy model, permissions, source defaults, or browser qualification status.

## 180 — Descriptor-safe list-cache serialization

Persisted cache byte accounting now serializes a detached JSON-data snapshot instead of caller-owned objects. Nested accessors, coercion hooks, custom prototypes, malformed arrays, cycles, non-JSON primitives, non-finite numbers, excessive depth, and excessive node work fail before `JSON.stringify` can invoke page- or caller-controlled behavior. The existing 256-entry cache envelope and 8,000,000-byte UTF-8 persistence ceiling remain unchanged.

## 181 — Descriptor-safe import-guard message discrimination

The import preflight guard reads runtime `type` and import `backupText` only through own enumerable data descriptors. Getter-bearing or inherited discriminators cannot trigger preflight or leak data through accidental property access. Listener identity and removal-during-preflight suppression remain intact.

## 182 — Descriptor-safe import activation inputs

Import activation budgeting snapshots candidate/current subscription arrays at the existing 128-entry ceiling, canonicalizes each subscription before decisions, and admits current cache reuse only through the canonical raw-cache boundary. Malformed current cache cannot manufacture reusable provenance.

## 183 — Non-bypassable import activation override

The helper override used for deterministic tests can only lower the reviewed per-import remote activation ceiling. Values must be safe integers from 0 through 16; coercive, fractional, unsafe, infinite, negative, or above-ceiling values fail before state inspection.

## 184 — Exact import-guard options

`createImportGuardedApi` no longer destructures an untrusted options object before validation. The options object is exact plain data with only optional `preflight`; malformed options fail before runtime listener registration.

## Validation status

The regression files added in this connector-only development block are repository coverage only. They are **not claimed as executed** here. `npm ci`, `npm run check`, packaging/release verification, reproducibility, source qualification, and real Chromium/Firefox qualification still have to run on one frozen exact head before PR #7 can leave draft status.
