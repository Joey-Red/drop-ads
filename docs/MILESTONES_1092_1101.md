# Milestones 1092–1101 — Manifest release integrity

This sequence repairs a stale canonical manifest audit and turns the reviewed manifest/runtime shape into a drift-resistant release boundary. Repository tests and audits remain preflight evidence only; Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

## M1092 — Content-script audit reconciliation

Reconciled `tools/manifest-audit.mjs` with the two content-script groups actually shipped by both browsers: the all-frame picker/cosmetic stack and the top-frame cookie-banner stack. Exact order, timing, and frame scope remain reviewed.

## M1093 — Canonical content contract

Added `tools/manifest-content-contract.mjs` as one immutable source-only definition of both groups and their flattened script-file list. The permission audit consumes this shared contract instead of carrying another drift-prone literal.

## M1094 — Content-contract integrity audit

Added `tools/manifest-content-contract-audit.mjs` to require every canonical script to be a unique local `.js` regular file under `src/`, reject escaping/non-local paths, and require both manifests to match the contract exactly.

## M1095 — Browser platform manifest audit

Added `tools/manifest-platform-audit.mjs` protecting Chromium module service-worker launch, Firefox module background-script launch, shared popup/options entry points, and the exact Firefox-only bootstrap DNR and Gecko compatibility surface.

## M1096 — Release-boundary integration audit

Added `tools/manifest-release-integration-audit.mjs` joining the content contract, permission, content-integrity, platform, parity, regression, and later surface-lock boundaries.

## M1097 — Canonical preflight promotion

Added the M1094–M1096 audits to package scripts and `npm run check` immediately after existing manifest/parity checks and before DNR layout auditing.

## M1098 — Exact top-level surface lock

Added `tools/manifest-surface-audit.mjs` requiring exact reviewed top-level manifest key sets for Chromium and Firefox. Surprise execution, embedding, override, external-connectivity, or other manifest surfaces cannot silently enter the package.

## M1099 — Surface-lock promotion

Wired `manifest-surface-audit` into canonical preflight and extended the manifest release integration audit through the M1098 boundary.

## M1100 — Exact-head manifest qualification guidance

Added `docs/MANIFEST_RELEASE_QUALIFICATION.md` covering candidate loading, browser-specific background launch, popup/options/content behavior, cookie-banner stack behavior, frame boundaries, Firefox compatibility differences, exact-candidate invalidation, and zero-retention requirements.

## M1101 — Canonical synchronization

Synchronized `ROADMAP.md` with M1092–M1101, advanced the next canonical milestone to M1102, added the manifest release-integrity audits and exact-head guide to the release gate, posted the matching observation delta to Issue #10, reconciled the prior M1091 roadmap regression, and added final roadmap coverage.

## Privacy and evidence boundary

The manifest contract/audits inspect repository source and generated release structure only. They add no browser observation service, telemetry, analytics, browsing/request history, page/DOM snapshots, URL/title/referrer retention, action outcomes, permission-use history, timestamps, identifiers, or owned Drop Ads backend.

Connector-created source/tests/audits and an issue closure never count as a browser pass. Exact current-package Chromium and Firefox observations remain required through Issue #10.
