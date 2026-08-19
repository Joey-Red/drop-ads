# Generated artifact exact-head qualification

Use this guide only with the exact Chromium and Firefox candidates produced from the source head being qualified. Repository audits prove source/build structure; they do **not** prove browser behavior. Issue #10 remains authoritative for the real browser observations.

## Preflight

From a clean checkout of the candidate head:

```sh
npm ci
npm run generated-extension-contract-audit
npm run generated-release-integration-audit
npm run check
npm run package
npm run verify:release
npm run verify:reproducible
```

Any source, manifest, list, generated-file contract, build-info, package member, source fingerprint, or package hash change invalidates earlier browser observations for that candidate.

## Contract expectations

Verify the generated tree and packaged candidate contain only reviewed contracted members plus explicit generated `manifest.json` and `build-info.json`:

- Chromium must **not** contain `rules/static.json`.
- Firefox must contain exactly the reviewed `rules/static.json` browser-only difference.
- `lists/` contains only `default.meta.json` and `default.txt`.
- no uncontracted source file, repository tool/test/doc, symlink, backup, secret-like file, archive, map, log, database, or temporary file is present;
- generated files match current source/build transformations byte-for-byte and both browsers bind to the same source fingerprint.

A successful repository audit is supporting evidence only. Do not mark browser status from these checks.

## Chromium exact-candidate observation

Load the exact generated Chromium candidate and verify:

1. the extension loads without manifest/background registration errors;
2. the module service worker launches from the reviewed manifest surface;
3. popup and Settings pages open and their normal recovery/accessibility controls operate;
4. the all-frame cosmetic/picker content stack loads on ordinary HTTP(S) pages;
5. the top-frame-only cookie-banner stack remains top-frame-only and retains Reject/Off behavior already required by the cookie-banner qualification scenario;
6. absence of `rules/static.json` does not create a runtime lookup/error path;
7. ordinary blocking/recovery remains functional without telemetry or retained browsing/action history.

Record observations only through the existing qualification record workflow tied to that exact candidate.

## Firefox exact-candidate observation

Load the exact generated Firefox candidate and verify:

1. the extension loads without manifest/background registration errors;
2. the module background-script launch shape works with the declared Gecko compatibility settings;
3. the reviewed bootstrap `rules/static.json` resource is accepted and does not alter the shared runtime contract unexpectedly;
4. popup, Settings, cosmetic/picker, and top-frame cookie-banner behavior matches the same functional boundaries required for Chromium;
5. no extra browser-only generated files appear beyond `rules/static.json`;
6. ordinary blocking/recovery remains functional without telemetry or retained browsing/action history.

## Fail-closed checks

If practical in a disposable working copy, verify preflight refuses each of these before treating a candidate as releasable:

- a new regular file added under `src/` without a contract update;
- a contracted source file removed or renamed;
- a third file added to root `lists/`;
- a symlink/non-regular release input;
- a Chromium `rules/static.json` member or a missing Firefox one;
- an unexpected generated output file;
- a generated file whose bytes no longer match its current source/build transformation.

Restore the exact source head and regenerate candidates after any mutation. Never carry observations from the intentionally modified candidate back to the real candidate.

## Privacy boundary

Do not collect or retain URLs, paths, queries, fragments, titles, referrers, page/DOM snapshots, blocked-request histories, action outcomes, statistics, timestamps, user/device identifiers, analytics, telemetry, or browser-language profiles while performing these checks. The qualification record retains only the already reviewed bounded browser/scenario result data.
