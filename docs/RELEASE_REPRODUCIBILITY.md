# Same-source release reproducibility

Drop Ads already has a deterministic release-integrity chain: current build inputs produce `build-info.json` and `sourceFingerprint`; generated browser trees are independently reconstructed/compared; the generated-file allowlist fails closed; deterministic ZIP/XPI archives are produced; `release-manifest.json` binds package bytes and packaging-tool hashes; and the independent release verifier parses the archives back to verified generated payloads.

Milestone 68 adds an orthogonal question: **does the same checkout produce exactly the same bytes when the full verified build/package process is run again from scratch?**

## Command

Run before recording package hashes for native-browser qualification or a release candidate:

```sh
npm run verify:reproducible
```

The command performs two sequential passes. Each pass:

1. runs `tools/build.mjs`, which removes/recreates `dist`
2. runs `tools/package.mjs`
3. therefore reruns the generated extension allowlist audit
4. verifies generated browser files byte-for-byte against current source/build inputs
5. writes deterministic Chromium ZIP and Firefox XPI packages
6. writes the release manifest, including packaging-tool provenance
7. runs the existing independent release verifier before the pass is considered complete
8. hashes every regular file under the resulting `dist` tree

After the second pass, the two snapshots must have exactly the same path set, byte lengths, and SHA-256 values. Differences are reported by repository-relative path. The comparison intentionally ignores filesystem mtimes, username, hostname, temporary path, process id, and other machine metadata because those values are not release payloads and must not be introduced into generated artifacts in the first place.

The first snapshot exists only in process memory. No comparison database/report is written into `dist` or shipped with the extension. On success the second pass is left in `dist` as the verified package set.

## Trust-chain role

This gate does not replace `npm run check`, `npm run package`, or `npm run verify:release`; it calls the same build/package verification path twice and compares the results. It catches accidental time/random/host/order-dependent generation that can evade a single internally-consistent build.

`tools/verify-reproducible.mjs` is itself listed in release-manifest packaging-tool provenance. A current-head reproducibility result is valid only when this command is actually executed on that exact checkout. Repository unit coverage of snapshot/comparison logic is not a reproducibility pass by itself.
