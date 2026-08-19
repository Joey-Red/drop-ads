# Exact-head browser qualification runbook

This runbook is for the real Firefox + Chromium qualification gate tracked by Issue #10. Repository tests, audits, generated records, schema-v3 `UNOBSERVED` scenario seeds, next-step hints, and readiness summaries are preflight; they are not browser qualification.

## 1. Freeze the candidate

Start from a clean checkout of the exact current `main` commit. Do not qualify from a dirty worktree or packages produced by another commit. Browser evidence is valid only for that exact candidate.

Keep evidence privacy-minimal: candidate commit/source fingerprint/package identity, browser versions, allowed scenario statuses, and concise behavior-only notes. Do not record hostname, username, cwd, timestamps, environment dumps, browsing/request history, page/DOM captures, identifiers, or statistics.

## 2. Run complete non-browser preflight

```sh
npm ci
npm run qualify:preflight
```

`npm run check` includes the current hardening gates:

- `qualification-io-audit`
- `qualification-runtime-hardening-audit`
- `build-release-hardening-audit`
- `package-pipeline-hardening-audit`
- `source-qualification-hardening-audit`
- `cosmetic-hardening-audit`
- `runtime-fanout-hardening-audit`
- `cache-subscription-hardening-audit`
- `storage-state-hardening-audit`
- `session-state-hardening-audit`
- `settings-session-recovery-audit`
- `settings-import-hardening-audit`
- `settings-accessibility-audit`
- `settings-form-ergonomics-audit`
- `settings-list-filter-audit`
- `settings-reset-audit`
- `settings-recovery-controls-audit`
- `picker-selector-hardening-audit`
- `popup-lifecycle-audit`
- `popup-semantics-audit`
- `popup-keyboard-audit`
- `community-submission-hardening-audit`

Build/package/record/source tooling is bounded, fail-closed, privacy-minimal, and exact-candidate bound. Passing these audits is preflight, not browser evidence.

M679–M728 protects deterministic cosmetic policy, bounded live fanout, deterministic subscription/cache policy, persisted storage/personal policy, and session recovery state. M729–M738 protects settings backup/import provenance and immutable canonical import boundaries. M739–M798 protects accessible resilient Settings/popup presentation, keyboard recovery, guidance, and dynamic-row semantics. M799–M808 protects native Settings form-state semantics, edit recovery, country-form readiness, and privacy-minimal cosmetic scope previews. M809–M818 protects popup state explanations, visible site/privacy guidance, and lifecycle-safe render/status/busy publication. M819–M828 protects bounded page-local Settings list filtering. M829–M848 protects deterministic bounded picker selector identity, stable snapshots, bounded selector work, and immediate pre-save exact-target revalidation. M849–M858 protects first-class Settings session recovery and configured reset. M859–M868 protects popup keyboard discoverability and native-control shortcut routing. M869–M878 protects optional community contribution from descriptor-safe browser candidate input through canonical public-domain issue preparation and bounded immutable validation. M879–M888 extends `community-submission-hardening-audit` across maintainer-approved promotion: exact promotion snapshots, stable strict-UTF-8 list reads, atomic list replacement, bounded one-line workflow outputs, no-follow output-file appends, semantic promoted-list revalidation, per-issue run serialization, a ten-minute runtime ceiling, and fail-closed stale-default-head detection before branch/PR preparation.

A repository/connector-created test that has not actually been executed is not a pass.

## 3. Prepare schema-v3 observation evidence

```sh
npm run qualify:observation
```

This validates the schema-v4 qualification record, verifies the current clean checkout, and prepares schema-v3 `artifacts/qualification-observation.json`. Every canonical scenario has independent Chromium and Firefox `{ status, notes }` fields. Browser versions/notes start blank and scenarios start `UNOBSERVED`.

If obsolete evidence must intentionally be discarded after confirming the candidate is exact-head current:

```sh
npm run qualify:observation:replace
```

Legacy schema-v2 observations are rejected as active evidence because their notes were shared by the browser pair and cannot be safely attributed automatically.

## 4. Confirm candidate identity

Before opening either browser, confirm the qualification and observation records agree with the exact Git commit, source fingerprint, Chromium ZIP hash/size, and Firefox XPI hash/size. If source changes, restart qualification for the new head.

## 5. Serve the deterministic fixture

```sh
npm run qualify:serve
```

The fixture is loopback-only and resource bounded. It retains no request logs, browsing history, telemetry, statistics, or identifiers.

## 6. Record Chromium observations

Load the exact generated Chromium package identified by the qualification record:

```sh
npm run qualify:mark -- browser chromium --version "<observed version>"
npm run qualify:next -- chromium
npm run qualify:mark -- scenario startup-core chromium PASS
```

Use only real observed `PASS`, `FAIL`, or `N/A`. Leave `UNOBSERVED` until actually exercised. Notes must be concise behavior-only text.

## 7. Record Firefox observations

Load the exact generated Firefox package from the same qualification record:

```sh
npm run qualify:mark -- browser firefox --version "<observed version>"
npm run qualify:next -- firefox
npm run qualify:mark -- scenario startup-core firefox PASS
```

Firefox notes are independent from Chromium notes. A browser-specific failure remains a blocker.

## 8. Revalidate and summarize

```sh
npm run qualification-observation-record-audit
npm run qualify:status
```

`qualify:status` is read-only and privacy-minimal. It reports readiness/counts without emitting candidate identity, browser-version values, notes, URLs, machine/user/path/time/environment data, browsing/request history, or identifiers.

## 9. Invalidation rule

Any source commit, source-fingerprint change, package hash/size change, or candidate-record mismatch invalidates prior browser observations. Re-run qualification rather than carrying results forward.

## 10. Release decision

A candidate is release-qualified only when every applicable Issue #10 scenario has a real observed result for both browsers, package identities still match the exact qualification record, schema-v3 evidence is current/valid, `qualify:status` has no failures or unexplained `UNOBSERVED` results, and the zero-telemetry / zero-history / zero-statistics / no-owned-backend invariants still hold.

M879–M888 code/tests/audits/docs were created or reconciled through the repository connector in this continuation and were not executed locally, in GitHub Actions, or in browsers here. They are preflight repository coverage, not a release qualification claim.
