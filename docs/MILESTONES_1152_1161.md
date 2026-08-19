# Milestones 1152–1161 — Generated verification I/O and tree hardening

This sequence hardens verification of the unpacked Firefox/Chromium generated trees after the M1142–M1151 build-output publication work. Repository tests, audits, generated trees, hashes, filesystem metadata, and structural checks are supporting/preflight evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1152 — Bounded verification source reads

Generated verification no longer reads contracted source/list members with unbounded pathname `readFile`. The shared opened-handle identity-safe source reader applies the existing 16 MiB generated-member ceiling while source manifests remain on bounded JSON I/O.

## M1153 — Bounded generated output reads

Generated `dist/<browser>/...` members are compared through the same regular-file, non-symlink, identity-safe opened-handle reader with the 16 MiB per-file ceiling and post-read stability checks.

## M1154 — Bounded generated-tree traversal

Generated tree auditing now caps work at 4,096 entries, 4,096 directories, and 1,024 UTF-8 bytes per repository-relative generated path before continuing traversal.

## M1155 — Real generated-tree types

Each generated browser root must be a real non-symlink directory, and every visited entry is classified from fresh `lstat` metadata before traversal or allowlist acceptance. Symlinks and other non-regular types fail closed.

## M1156 — Aggregate verification byte ceilings

Expected generated content and actual generated content are independently capped at 64 MiB per browser while retaining the 16 MiB per-file ceiling. Each admitted buffer advances the bounded aggregate before comparison continues.

## M1157 — Canonical generated paths

Generated-tree paths are canonicalized and rejected before allowlist use if they contain empty/dot/dot-dot segments, NUL, remaining backslash, a leading slash, or a normalized alias. The existing 1,024-byte UTF-8 ceiling remains in force.

## M1158 — Bounded generated-tree diagnostics

Generated tree audits retain at most 128 violations. Any additional violation fails immediately, and missing required members use the same bounded reporter.

## M1159 — Dedicated generated verification audit

A dedicated source audit protects the M1152–M1158 boundaries and focused regressions. The canonical generated-release integration gate invokes it, preserves prior M1102–M1107 and M1149 markers, and adds `extended through M1159 generated verification hardening boundaries` without adding another `npm run check` path.

## M1160 — Supporting-evidence guide

`docs/GENERATED_VERIFICATION_QUALIFICATION.md` records the exact local evidence, ceilings, audit markers, exact-head invalidation rules, privacy boundary, and separation between repository checks and real Issue #10 browser observations.

## M1161 — Canonical synchronization

The roadmap and Issue #10 supporting-evidence release gate now carry the complete generated-verification read/tree boundaries, the historical M1151 next-number regression is reconciled without erasing its completed M1152 handoff, the final roadmap regression protects the sequence, and canonical allocation advances to M1162. No repository evidence is represented as a browser pass.

## Privacy and evidence boundary

These changes inspect only local repository inputs, generated candidate files, and filesystem metadata required to verify them. They add no telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, accessibility-name retention, statistics, timestamps, user/device identifiers, locale/profile state, credentials, or owned Drop Ads backend. Repository evidence never substitutes for real Chromium + Firefox observations recorded through Issue #10.
