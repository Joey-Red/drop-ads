# Exact-head archive release qualification

This guide is supporting guidance for Issue #10. It validates that the exact packaged Chromium ZIP and Firefox XPI remain bound to the reviewed generated trees and release-tool provenance before browser observations. Repository audits, archive inspection, hashes, and generated records are **not** browser passes.

## Prepare one exact candidate

From the exact source head to be qualified:

```sh
npm ci
npm run qualify:preflight
```

Do not edit source, tools, generated trees, package files, or the release manifest after preflight. A source fingerprint, packaging-tool hash, generated member, archive hash/size, or release-manifest change invalidates that candidate.

The expected versioned candidates are:

- `dist/drop-ads-<version>-chromium.zip`
- `dist/drop-ads-<version>-firefox.xpi`
- `dist/release-manifest.json`

Use the package name/version recorded by the current repository when the product name changes; do not rename an archive after packaging.

## Repository preflight boundary

Canonical `npm run check` includes both:

```sh
npm run release-tool-contract-audit
npm run archive-release-integration-audit
```

The release-tool audit requires unique normalized repository-local `tools/*.mjs` provenance entries backed by regular non-symlink files. The archive integration marker is:

`canonical M1112-M1118 archive release boundaries are joined`

Direct `tools/package.mjs` also invokes the release-tool audit before package metadata, build identity, or archive creation.

## Release-manifest inspection

For the exact candidate, confirm:

- package name/version match the exact repository package identity;
- `sourceFingerprint` matches both generated browser build identities;
- `packagingTools` is exactly the canonical `RELEASE_TOOL_PATHS` set, with byte sizes and SHA-256 values for the current reviewed release tools;
- the Chromium descriptor names the versioned `.zip` and the Firefox descriptor names the versioned `.xpi`;
- descriptor sizes and SHA-256 values match the exact candidate files;
- no extra artifact or packaging-tool descriptor is accepted.

Do not treat a copied, renamed, rebuilt, or independently modified archive as the same candidate.

## Archive structural inspection

Both archive candidates must remain deterministic classic ZIP containers. Release verification requires:

- at most 1,024 entries;
- candidate archive size at most 64 MiB, checked before whole-file allocation;
- each entry at most 16 MiB;
- each encoded path at most 512 bytes;
- aggregate uncompressed bytes at most 64 MiB;
- version-made-by and version-needed exactly `20`;
- UTF-8 flag only and stored/no-compression method;
- zero DOS time/date fields;
- zero archive/entry comments and zero extra fields;
- disk number/start, internal attributes, and external attributes exactly zero;
- strictly ascending canonical entry names with no duplicates, absolute paths, backslashes, empty components, `.`/`..`, NULs, or directory entries;
- local version/flags/method/timestamps/CRC/sizes/name exactly agree with the central directory;
- local file records are contiguous and central-directory bounds leave no hidden or unreferenced bytes;
- CRC-32 matches every stored payload.

The deterministic writer has its own broader construction ceilings; the stricter release-verification ceilings above define what is accepted as a qualification candidate.

## Exact member and identity verification

The candidate archive entry set must exactly equal its generated tree:

- Chromium archive ↔ `dist/chromium/`
- Firefox archive ↔ `dist/firefox/`

Every payload must be byte-for-byte equal to the corresponding generated file. Generated roots, traversal directories, and members must remain real filesystem objects: symlinks and other non-regular entries fail closed.

Final source-member reads used for package creation and archive comparison use opened-handle identity checks with pre-allocation byte ceilings and post-read revalidation. A member that changes between pathname inspection and read must fail rather than silently entering or validating an archive.

## Fail-closed mutation checks

When testing failure behavior, use a disposable copy/candidate and restore or rebuild afterward. Verify that preflight/release verification refuses examples such as:

- an extra/missing archive member;
- modified archive payload bytes or CRC;
- reordered central entries;
- changed version/timestamp/attribute/extra/comment fields;
- trailing or hidden bytes;
- oversized archive/member/path/aggregate sizes;
- a symlink replacing an archive, generated member, generated directory, or release-tool provenance entry;
- a modified release tool whose manifest descriptor is stale;
- a release manifest with the wrong source fingerprint, package identity, artifact name, size, hash, or provenance set.

A deliberate mutation invalidates that candidate. Rebuild from the exact source head before recording browser evidence.

## Browser observation boundary

After repository/package/release verification succeeds, use the exact candidates from that unchanged preflight for the real Chromium and Firefox observations required by Issue #10. Loading/installing the candidate successfully is browser evidence only when it is explicitly observed and recorded through the qualification workflow; passing this archive guide alone is not.

The candidate must still satisfy all existing manifest, runtime, cookie-banner, blocking, recovery, accessibility, and privacy qualification requirements. Archive integrity does not replace those scenarios.

## Privacy boundary

Archive/release tooling must remain local and retain no browsing/request history, URLs from browsing activity, page/DOM snapshots, action/accessibility-name/consent data, browser-language profiles, action outcomes, statistics, timestamps, user/device identifiers, analytics, telemetry, credentials/tokens, or owned Drop Ads backend behavior. The release manifest describes only the local package identity, source fingerprint, reviewed packaging-tool provenance, and exact artifact hashes/sizes needed to bind the candidate.
