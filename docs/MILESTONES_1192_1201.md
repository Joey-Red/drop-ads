# Milestones 1192–1201 — Generated-source provenance hardening

This sequence closes the gap between the source fingerprint captured in `build-info.json` and the source bytes actually consumed while generating the Chromium and Firefox unpacked trees. These controls are supporting/preflight evidence only. They are not browser runtime observations; Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

## M1192 — Bind copied build sources to the recorded source fingerprint

Direct build copying now maps validated build-info descriptors by canonical source path. Every copied `src/` and `lists/` contract member must match the recorded descriptor byte length and SHA-256 immediately before publication, so source changes after initial fingerprinting fail closed.

## M1193 — Bind manifest transforms to fingerprinted manifest bytes

Chromium and Firefox source manifests are read as bounded regular-file bytes, checked against their build-info descriptors, decoded as strict UTF-8, and parsed as JSON only after provenance matches. Generated formatting is therefore derived from the exact fingerprinted manifest bytes.

## M1194 — Revalidate build-source ancestry around generated reads

Copied members and source manifests share one fingerprint-bound reader that snapshots repository-root/parent ancestry before I/O and revalidates every real non-symlink directory after the read. Ancestry replacement or symlink substitution fails closed before source bytes can influence generated output.

## M1195 — Re-fingerprint source state before accepting a completed build

After both browser trees are written, the build recreates canonical build-info from the repository. The final serialized build-info must exactly equal the initial serialized build-info; otherwise the build fails and the existing cleanup path invalidates `dist/`.

## M1196 — Preflight generated-source membership against build-info

Before generated publication starts, the build derives the complete source membership required by both browser contracts plus both source manifests. Every required canonical source path must already exist in the validated build-info descriptor map.

## M1197 — Bound per-browser generated source bytes

Each browser build has an independent 64 MiB aggregate ceiling for fingerprint-bound source bytes. Copied contract members retain the 16 MiB per-file ceiling, source manifests retain the 256 KiB ceiling, and bytes are charged before the corresponding generated publication.

## M1198 — Bound generated text before atomic publication

Serialized `build-info.json` and transformed manifest text are explicitly checked against the shared 8 MiB generated-text ceiling before atomic output I/O. Each manifest serialization is computed once, bounded, then published.

## M1199 — Re-audit source and generated contracts before build success

After final source re-fingerprinting succeeds, the source-tree audit and generated-extension contract audit run again before success is reported. Late semantic source/contract drift therefore follows the same fail-closed `dist/` invalidation path.

## M1200 — Extend build hardening audit through M1199

The dedicated build-input hardening audit now protects the M1192–M1199 generated-source provenance boundaries and requires their focused regressions. The integrated build/release audit retains all historical markers and adds `extended through M1199 generated-source provenance boundaries`.

## M1201 — Canonical synchronization

This record, the generated-build qualification guide, ROADMAP release gate, canonical numbering, Issue #10 supporting-evidence delta, and roadmap regression coverage are synchronized. Canonical milestone allocation advances to M1202.

## Qualification and privacy boundary

Connector-created tests and audits in this sequence were not executed locally or in browsers, and no browser qualification is claimed. A successful fingerprint comparison, build, audit, source revalidation, generated tree, or package remains preflight evidence only.

No new telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, statistics, timestamps, locale/language profiles, user/device identifiers, credentials, or owned Drop Ads backend state are introduced. Source bytes, canonical repository-relative paths, hashes, and transient filesystem metadata are inspected only as needed to prove build provenance.
