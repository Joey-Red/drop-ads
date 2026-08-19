# Milestones 1102–1111 — Contract-locked generated artifacts

This sequence makes the unpacked Firefox/Chromium extension contents an explicit reviewed release contract instead of an accidental consequence of recursive directory copying. Repository tests/audits are preflight evidence only; Issue #10 remains the authoritative exact-head browser qualification gate.

## M1102 — Generated extension contract

Added `tools/generated-extension-contract.mjs` and reconciled `tools/artifact-audit.mjs` with the complete current runtime. Chromium receives the common set; Firefox additionally requires `rules/static.json`.

## M1103 — Source/contract drift audit

Added `tools/generated-extension-contract-audit.mjs`. Every regular `src/` file must map to the contract, every contracted source file must exist, paths must remain unique/local/canonical, the root list input stays exactly `lists/default.meta.json` and `lists/default.txt`, and non-regular inputs fail closed.

## M1104 — Contract-driven build

`tools/build.mjs` now copies only reviewed contracted files one-by-one. `manifest.json` and `build-info.json` remain explicit generated outputs. New source files do not silently ship.

## M1105 — Direct-build preflight

Direct builds run the source/contract audit before build metadata or output mutation, so callers cannot bypass the generated-file boundary by invoking the build tool directly.

## M1106 — Output/source verification hardening

`tools/build-output-verify.mjs` derives expectations directly from the contract, uses bounded source-manifest parsing, audits the actual generated tree, compares every generated file byte-for-byte with its source/build transformation, and requires equal browser source fingerprints.

## M1107 — Canonical source/contract preflight

`generated-extension-contract-audit` is an explicit package script and runs in `npm run check` immediately after source-tree auditing.

## M1108 — Generated release integration audit

Added `tools/generated-release-integration-audit.mjs` joining the contract, drift audit, build, artifact tree audit, output verification, package path, and M1102–M1107 regressions.

## M1109 — Integration preflight promotion

`generated-release-integration-audit` is now a package script and canonical `npm run check` gate.

## M1110 — Exact-head qualification guidance

Added `docs/GENERATED_ARTIFACT_QUALIFICATION.md` for exact candidate inspection and browser observations without converting repository checks into browser evidence.

## M1111 — Canonical synchronization

Synchronized `ROADMAP.md` with the contract-locked generated artifact pipeline, advanced canonical allocation to M1112, added generated-contract/integration/byte-verification requirements to the Issue #10 release gate, and posted the matching exact-head qualification delta to Issue #10 without claiming a browser pass.

## Privacy/evidence boundary

The contract and audits inspect repository/build/package files only. They add no telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, statistics, timestamps, identifiers, credentials, or owned Drop Ads backend. Connector-created source/tests/audits and closed issues never count as Chromium or Firefox passes.
