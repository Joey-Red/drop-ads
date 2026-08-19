# Generated build I/O and source-provenance exact-head supporting evidence

Use this guide only against the same exact source head and generated Chromium/Firefox candidates that will be qualified through Issue #10. These checks are local supporting/preflight evidence; they do not record or replace browser observations. The generated-source provenance additions cover M1192–M1201.

## Local preparation

Run the canonical repository/build path from the exact head:

```sh
npm ci
npm run check
npm run build
npm run artifact-audit
```

A successful run should leave only the contract-locked unpacked trees expected under `dist/chromium/` and `dist/firefox/`. Any source or generated-member change requires rebuilding and requalifying the new exact candidate.

## Build-output boundaries to inspect

Confirm the canonical build path retains all of these properties:

- generated text and binary outputs use same-parent cryptographically random temporary names from `randomBytes(16)`, never `Math.random`;
- temporary files are opened exclusively with mode `0600`, fsynced, atomically renamed, and cleaned on failure;
- output paths are canonical repository-relative forward-slash paths below `dist/`, with no empty/dot/dot-dot/backslash/NUL/absolute aliases and at most 1,024 UTF-8 bytes;
- the repository root and every output-parent directory component are real non-symlink directories, with ancestry bounded to 32 components;
- the final parent filesystem identity is revalidated immediately before rename;
- the published path is rechecked as a regular non-symlink file with the exact expected byte size;
- copied contract members are limited to 16 MiB each and are read through bounded opened-handle source identity checks before atomic binary publication;
- generated `manifest.json` and `build-info.json` remain explicit bounded atomic text outputs;
- build directories are created one segment at a time without recursive directory creation and are rechecked after creation;
- any failure after current-build invalidation removes the partial `dist/` tree; cleanup failure is surfaced rather than hidden.

## Generated-source provenance boundaries

For the exact build used to create candidates, additionally confirm:

- every copied `src/` or `lists/` contract member is mapped to its canonical build-info descriptor and must match the recorded byte length and SHA-256 before generated publication;
- Chromium and Firefox source manifests are read as regular non-symlink files under a 256 KiB ceiling, matched to their build-info descriptors, decoded as strict UTF-8, and parsed only after provenance succeeds;
- each fingerprint-bound source read snapshots the repository root and all source-parent directories through the bounded build-input ancestry helper, then revalidates that ancestry before accepting the bytes;
- the complete generated-source membership across both browser contracts plus both source manifests is required to exist in build-info before publication starts;
- fingerprint-bound source consumption is independently capped at 64 MiB per browser, with copied-member and manifest bytes charged before their corresponding generated writes;
- serialized `build-info.json` and each transformed browser manifest are explicitly bounded by the shared 8 MiB generated-text ceiling before atomic output I/O;
- after both browser trees are written, canonical build-info is recreated and must exactly match the initial serialized build-info; source drift during build invalidates the build;
- after that final equality check, the source-tree and generated-extension contract audits run again before success is reported;
- all failures above flow through the existing partial-`dist/` invalidation path.

The build-input hardening audit must retain its historical markers and add:

- `build-input-hardening-audit: extended through M1199 generated-source provenance boundaries verified`

The integrated build/release audit must retain its M1169/M1179/M1189 markers and add:

- `build-release-hardening-audit: extended through M1199 generated-source provenance boundaries`

The canonical generated-release integration audit must retain:

- `canonical M1102-M1107 generated artifact boundaries are joined`
- `extended through M1149 atomic generated build I/O boundaries`

`npm run check` should invoke `build-release-hardening-audit` and `generated-release-integration-audit` exactly once each. Audit/build success remains supporting evidence only.

## Exact-candidate handoff

After local build/package/verification support checks, perform the real Chromium and Firefox observations required by Issue #10 against the exact generated/package candidates. A source commit, generated-member change, build-output change, source fingerprint change, generated-source provenance boundary change, package hash/size change, or release-manifest mismatch invalidates previous exact-head evidence.

## Privacy boundary

Do not collect or retain browsing/request history, full visited URLs, page/DOM snapshots, action outcomes, statistics, timestamps, user/device identifiers, language/profile state, credentials, analytics, or telemetry while performing these checks. The guide requires no owned Drop Ads backend and creates no browser observation result by itself.
