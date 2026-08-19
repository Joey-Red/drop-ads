# Release verification and reproducibility qualification

This guide covers local supporting evidence for the exact Chromium ZIP and Firefox XPI candidates produced from the current source head. It does **not** record or replace browser qualification. Issue #10 remains authoritative for real exact-head Chromium + Firefox observations.

## Prepare the exact candidates

From a clean checkout of the intended head:

```sh
npm ci
npm run package
npm run verify:release
npm run verify:reproducible
```

`npm run package` builds the generated trees, creates the deterministic versioned candidates, writes `dist/release-manifest.json`, and verifies the resulting release. `verify:release` and `verify:reproducible` can also be run directly against those exact local outputs.

## Canonical release identity and candidate names

The release package identity uses one shared validator. Package name is limited to 128 characters, version to 64 characters, and both accept only `[A-Za-z0-9._@+-]+`.

For a package named `<name>` and version `<version>`, the only accepted candidate request paths are:

```text
dist/<name>-<version>-chromium.zip
dist/<name>-<version>-firefox.xpi
```

Release-manifest creation rejects alternate candidate paths before opening or hashing them.

## Release-manifest hashing boundary

The manifest hashes local release inputs with opened-handle identity checks and streaming SHA-256. Work is bounded before hashing:

- each reviewed release tool: at most 2 MiB;
- each Chromium ZIP / Firefox XPI candidate: at most 64 MiB;
- recorded descriptor byte counts must remain within the same ceilings.

A candidate/tool that is a symlink, is not a regular file, exceeds its ceiling, changes identity before hashing, grows or changes size while hashing, or changes size/mtime/ctime before the final snapshot fails closed.

## Direct `verify:release`

`verifyRelease(root)` first runs the canonical release-tool provenance audit. It then verifies current package/build identity, generated extension bytes, the recorded release manifest against freshly described current tools/candidates, and each deterministic ZIP/XPI member against the corresponding generated browser tree.

A direct invocation cannot skip the release-tool provenance preflight:

```sh
npm run verify:release
```

A successful local command is supporting release evidence only; it is not a Chromium or Firefox runtime observation.

## Reproducibility snapshot boundary

Each verified reproducibility pass is bounded to:

- 4,096 files;
- 4,096 directories;
- 64 MiB per file;
- 256 MiB aggregate snapshot bytes;
- 1,024 UTF-8 bytes per repository-relative path.

The top-level `dist/` set must be exactly:

```text
chromium/
firefox/
<name>-<version>-chromium.zip
<name>-<version>-firefox.xpi
release-manifest.json
```

Missing members, extra members, symlinks, or wrong file/directory types fail before recursive snapshot hashing.

The two build/package child passes receive a frozen string-only environment snapshot with `NODE_OPTIONS`, `NODE_PATH`, `NODE_REPL_EXTERNAL_MODULE`, and `NODE_ICU_DATA` removed. Ordinary platform variables remain available so Windows and Linux execution are not needlessly broken.

`npm run verify:reproducible` requires two verified build/package passes to produce the same bounded `dist/` path/size/SHA-256 snapshot.

## Canonical integration evidence

`npm run check` includes both:

```sh
npm run release-tool-contract-audit
npm run archive-release-integration-audit
```

The archive integration audit preserves:

```text
canonical M1112-M1118 archive release boundaries are joined
```

and extends the protected boundary with:

```text
extended through M1128 release verification and reproducibility boundaries
```

The integration audit is source-only supporting evidence. It does not create a browser qualification result.

## Candidate invalidation

Do not carry prior browser observations or local candidate evidence forward after any change that can alter the exact release. Re-run preparation and qualification when any of these change:

- source head or source fingerprint;
- package name/version;
- release-tool provenance;
- generated browser members or bytes;
- release manifest;
- candidate hash, byte size, archive structure, or member bytes;
- reproducibility top-level topology or snapshot bytes;
- any other exact-candidate binding checked by the qualification record.

## Real browser observation

After local preflight and candidate verification, use the existing qualification runbook and Issue #10 to observe the exact generated candidates in both browsers. Repository tests, hashes, deterministic archives, source-only audits, successful `verify:release`, and successful `verify:reproducible` are supporting evidence only.

Do not collect or retain browsing/request history, visited URLs, page or DOM snapshots, action labels, accessibility names, cookie-banner action outcomes, statistics, timestamps, identifiers, credentials, analytics, or telemetry while performing this qualification. No owned Drop Ads backend is required.
