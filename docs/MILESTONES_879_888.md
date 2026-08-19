# Milestones 879–888 — Community promotion workflow hardening

This canonical block hardens the maintainer-approved GitHub promotion path after community submission validation. It preserves the permanent browser-local/no-tracking boundary: no Drop Ads backend, telemetry, browsing/request history, contribution history, user/device identifier, extension GitHub token, or automatic merge is introduced. `ROADMAP.md` remains the sole canonical milestone-number authority.

## M879 — Canonicalize promotion input and immutable results

- Community promotion accepts only an exact plain own-data `{body, listText}` input snapshot.
- Accessors, extra fields, custom prototypes, and oversized values fail closed before promotion work.
- Promotion outcomes are immutable and the promoted list remains bounded by the shared community-list ceiling.
- Canonical regression: `tests/community-promotion-boundary-v879.test.js`.

## M880 — Bound and stabilize community-list reads

- Validation/promotion CLIs read the shared list through one bounded regular-file boundary.
- Symlinks are rejected, UTF-8 decoding is fatal/strict, and file identity/metadata must remain stable across the read.
- Canonical regression: `tests/community-list-read-boundary-v880.test.js`.

## M881 — Persist promoted lists atomically

- Promotion writes use an exclusive same-directory `0600` temporary file, fsync, conflict/identity recheck, atomic rename, and failure cleanup.
- The promotion CLI no longer performs a direct in-place list write.
- Canonical regression: `tests/community-list-atomic-v881.test.js`.

## M882 — Serialize workflow outputs strictly

- GitHub workflow values are snapshotted from own data, byte/character bounded, and reject newline/NUL injection.
- Only reviewed booleans/status/candidate/reason fields are emitted; full list text is never written to workflow output.
- Canonical regression: `tests/community-workflow-output-v882.test.js`.

## M883 — Harden GitHub workflow output-file I/O

- `$GITHUB_OUTPUT` appends are bounded and require a regular non-symlink file.
- The writer uses no-follow semantics where available and verifies the opened file identity against the pre-open snapshot.
- Both validation and promotion CLIs route workflow output through this boundary.
- Canonical regression: `tests/community-workflow-file-io-v883.test.js`.

## M884 — Revalidate promoted-list semantics

- A changed promotion is parsed again before it is returned for persistence.
- The canonical candidate must occur exactly once in the resulting block policy; semantic drift fails closed and leaves the original list unchanged.
- Canonical regression: `tests/community-promotion-revalidation-v884.test.js`.

## M885 — Serialize promotion runs per issue

- The approval workflow uses a per-issue concurrency group and does not cancel an in-progress promotion.
- Duplicate label events for one issue therefore cannot race separate promotion writes/PR preparation paths.
- Canonical regression: `tests/community-promotion-concurrency-v885.test.js`.

## M886 — Reject stale or unbounded promotion runs

- Promotion jobs have an explicit ten-minute runtime ceiling.
- Immediately before branch/PR preparation, the workflow fetches the default branch and refuses to continue if it changed after candidate validation; the maintainer must re-apply approval so current policy is revalidated.
- Canonical regression: `tests/community-promotion-stale-head-v886.test.js`.

## M887 — Extend the executable community hardening gate

- `community-submission-hardening-audit` now enforces the promotion snapshot, semantic revalidation, bounded/stable list I/O, atomic persistence, workflow-output boundary, per-issue serialization, stale-head rejection, and their canonical regressions through M886.
- The existing gate remains part of `npm run check`.
- Canonical regression: `tests/community-promotion-hardening-audit-v887.test.js`.

## M888 — Synchronize canonical state

- This milestone record, `ROADMAP.md`, qualification guidance/state, and Issue #10 are synchronized with M889 declared next.
- Repository-created tests/audits remain preflight evidence only and do not substitute for real browser observations.

## Evidence boundary

M879–M888 work was created or reconciled through the GitHub connector. Connector-created/updated tests and audits were **not executed locally or in browsers here**; `npm run check` and GitHub Actions are not claimed as run. No Chromium or Firefox runtime observation or release qualification is claimed. Issue #10 remains the authoritative exact-head real-browser gate.

The privacy boundary is unchanged: zero telemetry, analytics, browsing/request history, page/DOM snapshots, matched-element history, retained contribution statistics/history, user/device identifiers, extension GitHub credentials, or owned Drop Ads backend behavior.
