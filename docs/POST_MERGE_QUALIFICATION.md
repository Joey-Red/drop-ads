# Post-merge qualification state

PR #7 is already merged into `main`. `main` is the authoritative implementation line, but the merge is not a release-qualification claim.

Issue #10 remains open and is the authoritative Firefox + Chromium runtime qualification gate. Qualification must start from a clean checkout of the exact `main` commit being tested. Any source commit after browser observation invalidates those observations.

Repository/connector-added tests, audits, generated records, fixtures, readiness summaries, and `UNOBSERVED` seeds are preflight evidence only unless actually executed and observed. They never substitute for real browser observations.

## Current hardening state

M539–M678 established exact-head privacy-minimal browser evidence and hardened qualification/build/package/source pipelines. M679–M728 hardened deterministic cosmetic policy, runtime fanout, subscription/cache policy, persisted state, and session recovery state.

M729–M738 protects settings backup/import provenance, immutable imported state, explicit required fields, and duplicate canonical identity rejection. `settings-import-hardening-audit` protects this boundary.

M739–M798 protects resilient Settings/popup presentation, navigation/keyboard recovery, policy guidance, dynamic-list semantics, explicit recovery actions, and focus-safe row rerenders. `settings-accessibility-audit` protects this boundary.

M799–M808 protects Settings form-state ergonomics and input recovery. Settings uses native constraint validity for `aria-invalid`, privacy-minimal edit recovery, local backup error association, unambiguous Country/TLD source selection, gated country submission, and non-echoing cosmetic scope previews. `settings-form-ergonomics-audit` protects this repository boundary.

M809–M818 protects popup semantics and async lifecycle ownership. Idle site-state explanations are derived from current local UI only; site actions use visible current-site context; the master switch and visible local-only privacy cue are explicit; pagehide invalidates queued/in-flight render, status, and busy/finalizer work. `popup-semantics-audit` and `popup-lifecycle-audit` protect these repository boundaries.

M819–M828 protects transient Settings list filtering. Queries are bounded, page-local, never persisted or transmitted, and change presentation only; matching is scoped to visible row identity; generic feedback avoids retained statistics; named search regions, Clear/Escape/ArrowDown recovery, rerender preservation, responsive/contrast-safe presentation, and pagehide teardown are enforced by `settings-list-filter-audit`.

M829–M848 protects deterministic picker identity, bounded selector work, stable snapshots, and exact-target save revalidation. `picker-selector-hardening-audit` enforces these repository boundaries.

M849–M858 protects Settings recovery controls. Temporary session pauses remain browser-session-only deterministic runtime-mediated state; configured reset remains a separate persistent-configuration transaction that preserves session pauses, uses inline confirmation, keyboard-safe cancellation, and strict busy ownership. `settings-session-recovery-audit`, `settings-reset-audit`, and `settings-recovery-controls-audit` protect these repository boundaries.

M859–M868 protects popup keyboard discoverability and shortcut interaction without creating a second policy path. G/S/C/P/E/O route only to existing native popup controls; unsafe/modified/text-entry/repeat/composition input fails closed; unavailable or busy controls cannot be shortcut-activated; `?`/Escape provide page-local help focus recovery; and resilient presentation remains explicit. `popup-keyboard-audit` protects this repository boundary.

M869–M878 protects the optional GitHub community submission boundary. Browser-side candidate input is descriptor-safe and immutable; exact URLs are safety-checked and reduced to a canonical public hostname; issue title/body/URL construction is bounded and independently revalidates the public candidate; validation snapshots bounded exact inputs, accepts one canonical bare-domain candidate, and returns immutable classified outcomes. `community-submission-hardening-audit` protects this boundary.

M879–M888 hardens maintainer-approved promotion after validation. Promotion snapshots exact own-data input and immutable bounded results; community-list reads are regular-file, non-symlink, strict-UTF-8, bounded, and stability checked; changed lists use exclusive fsynced atomic replacement; workflow outputs are one-line bounded own-data values written through identity-checked no-follow file I/O; changed policy is semantically revalidated before persistence; promotion runs serialize per issue, have a ten-minute ceiling, and refuse a default-branch change after validation. `community-submission-hardening-audit` now protects these promotion boundaries through M886.

## Privacy boundary

Normal operation and qualification tooling retain the project invariants: no telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained blocked-request or contribution statistics database, user/device identifiers, GitHub token, or owned Drop Ads backend.

All repository audits are preflight only. They do not collect browser activity or create browser evidence.

## Current preparation flow

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
npm run qualify:serve
```

`qualify:preflight` runs `npm run check`, whose current hardening gates include `qualification-io-audit`, `qualification-runtime-hardening-audit`, `build-release-hardening-audit`, `package-pipeline-hardening-audit`, `source-qualification-hardening-audit`, `cosmetic-hardening-audit`, `runtime-fanout-hardening-audit`, `cache-subscription-hardening-audit`, `storage-state-hardening-audit`, `session-state-hardening-audit`, `settings-session-recovery-audit`, `settings-import-hardening-audit`, `settings-accessibility-audit`, `settings-form-ergonomics-audit`, `settings-list-filter-audit`, `settings-reset-audit`, `settings-recovery-controls-audit`, `picker-selector-hardening-audit`, `popup-lifecycle-audit`, `popup-semantics-audit`, `popup-keyboard-audit`, and `community-submission-hardening-audit`. Packaging, release verification, reproducibility verification, source qualification, qualification-record generation, and record auditing follow.

After loading the exact generated packages, record only real observations through the guarded editor:

```sh
npm run qualify:mark -- browser chromium --version "<observed version>"
npm run qualify:next -- chromium
npm run qualify:mark -- scenario startup-core chromium PASS
npm run qualify:mark -- browser firefox --version "<observed version>"
npm run qualify:next -- firefox
npm run qualify:mark -- scenario startup-core firefox PASS
```

After all applicable real observations for the same exact candidate:

```sh
npm run qualification-observation-record-audit
npm run qualify:status
```

Any source commit, source-fingerprint change, package hash/size change, or candidate-record mismatch invalidates prior browser observations. Re-run qualification rather than carrying results forward.

The current M879–M888 repository changes were created or reconciled through the connector and were not executed locally or in browsers in this continuation. `npm run check`, GitHub Actions, and browser qualification were not executed here. No browser or release qualification is claimed.

See `docs/QUALIFICATION_RUNBOOK.md`, `docs/QUALIFICATION_OBSERVATION_TEMPLATE.md`, and the current milestone records through `docs/MILESTONES_879_888.md` for the exact-head workflow and repository hardening state.
