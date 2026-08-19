# Milestones M1202–M1211 — Generated-verification provenance binding

This sequence closes the gap between generated build publication and generated-content verification. All work is local supporting/preflight evidence. **Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.**

## M1202 — Direct-build generated verification gate

`tools/build.mjs` now invokes the canonical `verifyBuiltExtensionsContent(root)` verifier after the final source re-fingerprint and source/contract semantic re-audits, but before reporting build success. Verification failure remains inside the existing partial-`dist/` invalidation path, and the verified source fingerprint must match the direct build fingerprint.

## M1203 — Copied-source fingerprint binding

Generated verification maps the current build-info inputs by canonical path. Every expected copied `src/` or `lists/` member must match its build-info descriptor byte length and SHA-256 before its bytes can define expected generated output.

## M1204 — Raw source-manifest fingerprint binding

Chromium and Firefox source manifests are read as bounded raw regular-file bytes under the 256 KiB source-manifest ceiling. The raw `manifests/<browser>.json` bytes must match the build-info descriptor before strict UTF-8 decoding, JSON parsing, and deterministic generated-manifest formatting.

## M1205 — Expected-source ancestry revalidation

Copied source members and source manifests share one fingerprint-bound expected-source reader. It snapshots the real non-symlink repository/source-parent ancestry before bounded I/O, revalidates that ancestry after the read, and only then accepts the build-info descriptor match.

## M1206 — Generated-output ancestry revalidation

Each generated output member read is anchored to the audited `dist/<browser>` root. The verifier snapshots browser-root/output-parent ancestry before bounded I/O and revalidates it afterward, so parent replacement or symlink races after the tree audit fail closed before byte comparison.

## M1207 — Per-browser final source re-fingerprint

Each browser verification pass preserves the exact serialized build-info used to construct expected bytes. After all generated members have been read and compared, build-info is recreated and must serialize identically before that browser pass can succeed.

## M1208 — Shared Chromium/Firefox source snapshot

Paired verification now creates one canonical build-info snapshot and uses that exact snapshot for both Chromium and Firefox expected-byte construction. Both browser results must match the shared source fingerprint, and a final build-info recreation after both passes must still equal the shared serialized snapshot. Standalone single-browser verification retains its own equivalent source snapshot.

## M1209 — Verification-source membership preflight

Before expected-byte construction begins, the verifier derives the browser's complete source membership: `manifests/<browser>.json` plus every copied `src/`/`lists/` contract source. Every required canonical source path must already exist in the build-info descriptor map, so contract/fingerprint membership drift fails before source reads or transformations.

## M1210 — Canonical audit extension

`tools/generated-verification-hardening-audit.mjs` now protects the M1202–M1209 provenance boundaries and requires their focused regressions. It preserves `canonical M1152-M1158 generated verification boundaries verified` and adds `extended through M1209 generated verification provenance boundaries verified`.

`tools/generated-release-integration-audit.mjs` preserves the M1107/M1149/M1159 integration markers and adds `extended through M1209 generated verification provenance boundaries`. Existing `npm run check` wiring continues to invoke the generated-release integration gate exactly once.

## M1211 — Canonical synchronization

This document, `docs/GENERATED_VERIFICATION_QUALIFICATION.md`, `ROADMAP.md`, the roadmap regression, and Issue #10 supporting-evidence delta are synchronized. Canonical milestone allocation advances to M1212.

## Qualification and privacy boundary

Connector-created tests and audits in this sequence were not executed locally or in browsers, so this sequence makes **no browser qualification claim**. Repository tests, static audits, generated-tree verification, hashes, source fingerprints, and exact-head supporting guides do not substitute for the real Chromium + Firefox observations required by Issue #10.

Generated verification must remain local and ephemeral. It must not retain telemetry, analytics, browsing/request history, full visited URLs, page/DOM snapshots, blocked-request or action outcomes, action/accessibility labels, consent context, language/profile state, statistics, timestamps, user/device identifiers, credentials, or owned Drop Ads backend data.
