# Release output and archive-writer qualification

This guide covers the M1132–M1141 atomic release-output and deterministic archive-writer boundary on the exact source head being considered for release. It is **supporting/preflight evidence only**. Issue #10 remains the authoritative real Chromium + Firefox browser qualification gate, and none of the checks below are browser passes.

## Prepare the exact candidate

From the exact source head:

```sh
npm ci
npm run check
npm run package
npm run verify:release
npm run verify:reproducible
```

Do not carry package or browser evidence forward after a source, release-tool provenance, archive-contract, generated-member, package identity, candidate, or release-manifest change. Rebuild and re-qualify the new exact head.

## Atomic release-output boundary

Confirm the release-tool provenance contract includes `tools/atomic-output-temp.mjs`, `tools/release-output-io.mjs`, `tools/package-output-io.mjs`, and `tools/release-manifest-io.mjs`.

The reviewed behavior is:

- release-manifest persistence uses the same bounded atomic text writer as other release text output;
- temporary files are created in the final output parent with exclusive `wx`, mode `0600`, and a 128-bit cryptographic suffix from `randomBytes(16)`;
- the destination parent must be a real non-symlink directory and its filesystem identity is revalidated immediately before publish;
- file contents are fsynced before the atomic rename;
- the published path is then required to be a regular non-symlink file with exactly the expected byte size;
- temporary files are removed on a failed write path;
- packaging removes the exact current Chromium ZIP, Firefox XPI, and `release-manifest.json` before candidate creation and removes them again after a package/verification failure;
- generated `dist/chromium/` and `dist/firefox/` trees are not treated as failed-release cleanup targets.

A packaging failure must therefore not leave a mixed old/new set that can be mistaken for one verified release.

## Shared deterministic archive contract

Both deterministic archive creation and ZIP verification consume `tools/release-archive-contract.mjs`. The canonical archive ceilings are:

- at most 1,024 archive entries;
- at most 64 MiB for the complete archive;
- at most 16 MiB for any one stored member;
- at most 512 UTF-8 bytes for an archive member path;
- at most 64 MiB aggregate uncompressed member bytes.

Writer source discovery additionally allows at most 4,096 directories and 1,024 UTF-8 bytes per source-relative traversal path. Total discovered filesystem entries cannot exceed the only possible combined reviewed file+directory budget.

The writer must use bounded directory iteration, deterministic per-directory sorting, and lstat-based refusal of symlinks and other non-regular release inputs. The complete local-data + central-directory + EOCD size is checked against the 64 MiB archive ceiling before the final combined archive Buffer is allocated and the same ceiling is passed to atomic publication.

## Integration gate

`npm run check` includes `archive-release-integration-audit` exactly once. The audit must retain all three markers:

- `canonical M1112-M1118 archive release boundaries are joined`
- `extended through M1128 release verification and reproducibility boundaries`
- `extended through M1139 atomic output and archive writer boundaries`

The newest extension binds the M1132–M1139 regressions and the shared archive contract into the existing release provenance/archive gate.

## Exact candidate observation handoff

After the local checks above succeed on the exact source head, use the same exact versioned Chromium ZIP and Firefox XPI candidates for the real browser observations required by Issue #10. Continue with the existing manifest, generated-artifact, archive-release, cookie-banner, and qualification runbooks referenced by `ROADMAP.md`.

Repository tests, file hashes, archive structure, atomic-output checks, reproducibility snapshots, and this guide do not record Chromium or Firefox behavior. They only establish that the candidate handed to browser qualification was produced through the reviewed local release boundary.

## Privacy boundary

These checks operate only on local repository/build/release files, bounded filesystem metadata, and local process state needed to build and verify packages. They retain no telemetry, analytics, browsing/request history, full visited URLs, page/DOM snapshots, banner/action outcomes, statistics, timestamps, identifiers, language/profile state, credentials, or user/device tracking data, and require no owned Drop Ads backend.
