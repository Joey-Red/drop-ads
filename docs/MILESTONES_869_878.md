# Milestones 869–878 — Community contribution boundary hardening

This canonical block hardens both sides of Drop Ads' optional GitHub community flow: browser-side preparation and maintainer-side moderation/promotion. It adds no Drop Ads server, GitHub token in the extension, telemetry, browsing/request history, retained contribution history/statistics, or user/device identifier. `ROADMAP.md` is the sole canonical milestone-number authority; overlap-era picker/popup issue, commit, and test labels remain supporting history only.

## M869 — Bound and snapshot community inputs

- Browser candidate rules cross an exact descriptor-safe own-data boundary before normalization.
- Moderation validation snapshots exact `{body, listText}` own-data input before parsing and applies 64 KiB submission / 4 MiB list ceilings.
- Hostile accessors, symbols, extra fields, custom prototypes, and type-confused inputs fail closed without being invoked.
- Regressions: `tests/community-input-snapshot-v869.test.js` and `tests/community-validation-input-v869.test.js`.

## M870 — Bound candidate reduction and scanning

- Eligible unscoped domain/exact-URL local blocks reduce to an immutable canonical domain candidate before GitHub handoff; exact URLs are safety-checked before hostname-only reduction.
- Moderation extracts exactly one fenced `block domain` record with bounded first/duplicate scanning rather than materializing every match.
- Candidate data contains no original path, query, fragment, source-page identity, request log, or account-like context.
- Regressions: `tests/community-candidate-immutable-v870.test.js` and `tests/community-validation-scan-v870.test.js`.

## M871 — Bound immutable issue and validation records

- Community issue title/body construction is bounded and control-character checked.
- Moderation results use only the reviewed `invalid`, `duplicate`, `covered`, `conflict`, and `ready` statuses; returned records are immutable and reason text is newline-sanitized/capped.
- Regressions: `tests/community-issue-bounds-v871.test.js` and `tests/community-validation-result-v871.test.js`.

## M872 — Require canonical public candidates

- The issue builder independently snapshots `{kind: "domain", value}`, requires already-canonical spelling, and reuses public remote-rule safety admission.
- Moderation likewise requires exact canonical bare-domain spelling; silently normalizable, private/local/reserved, URL/path/query/credential, and filter-syntax inputs fail closed.
- Covered/conflict explanations remain generic and do not echo existing community-rule values.
- Regressions: `tests/community-issue-candidate-snapshot-v872.test.js` and `tests/community-validation-canonical-v872.test.js`.

## M873 — Bound community promotion construction

- Maintainer promotion snapshots exact `{body, listText}` own-data input before validation/output construction and applies the same 64 KiB / 4 MiB ceilings as moderation validation.
- Oversized, accessor-backed, custom-prototype, or otherwise malformed promotion input fails closed with an immutable privacy-minimal result and no list mutation.
- Deterministic candidate insertion remains idempotent; canonical byte/text requirements are tightened at the file and pure-promotion boundaries in M875–M876.
- Regressions: `tests/community-promotion-boundary-v873.test.js`, `tests/community-promotion-bounds-v873.test.js`, and supporting `tests/community-promotion-idempotent-v874.test.js`.

## M874 — Bound issue URLs and strict community-list reads

- Prefilled GitHub issue fields cross an exact descriptor-safe bounded boundary; URL construction uses only the fixed reviewed GitHub new-issue destination, percent-encoded fields, and an explicit final URL ceiling.
- Validation/promotion CLIs read the community list through one strict UTF-8, regular non-symlink, 4 MiB boundary.
- Opened-handle reads verify size/mtime/ctime stability; malformed UTF-8 or changing files fail closed.
- Regressions: `tests/community-issue-url-v874.test.js`, `tests/community-file-io-v874.test.js`, and `tests/community-promotion-idempotent-v874.test.js`.

## M875 — Preserve exact-URL privacy and atomically persist byte-canonical lists

- Exact URL local blocks can contribute only their canonical public hostname; paths, queries, fragments, source-page identity, browsing/request history, and identifiers remain outside GitHub preparation.
- Community list file text is strict UTF-8/LF form with no BOM, NUL, carriage returns, or missing final LF on non-empty content.
- Promotion persistence uses an exclusive same-directory `0600` temp file, fsync, source identity/stability comparison, atomic rename, and best-effort cleanup.
- Regressions: `tests/community-url-privacy-v875.test.js`, `tests/community-file-io-v875.test.js`, and `tests/community-file-atomic-v875.test.js`.

## M876 — Bound descriptor-safe community workflow outputs

- The pure promotion boundary accepts only exact plain own-data `{body, listText}` input and rejects BOM, NUL, carriage-return/CRLF text, or missing final LF rather than silently rewriting noncanonical list content.
- Rejected noncanonical promotion input returns the fixed immutable invalid envelope with empty `listText`, so rejected input is not echoed.
- Promoted list output is measured before acceptance and cannot exceed the supported list ceiling.
- Moderation/promotion workflow outputs accept exact plain own-data schemas only; accessors, symbols, extras, custom prototypes, multiline/control-bearing values, and oversized serialized output fail closed.
- Full promotion `listText` is never emitted through workflow output serialization.
- Regressions: `tests/community-promotion-canonical-v876.test.js`, `tests/community-validation-boundary-v876.test.js`, `tests/community-promotion-size-v876.test.js`, and `tests/community-output-v876.test.js`.

## M877 — Enforce community contribution hardening

- `community-submission-hardening-audit` protects browser-side candidate reduction, public-domain admission, bounded reviewed issue construction, moderation/promotion bounds, byte-canonical promotion/file boundaries, atomic persistence, strict workflow output, and the no-tracking boundary.
- `community-hardening-audit` independently locks the canonical M869–M876 community invariants and rejects silent CRLF normalization at the pure-promotion boundary.
- Both gates are wired into `npm run check` and remain repository preflight only.
- Gate regressions: `tests/community-submission-hardening-audit-v877.test.js` and `tests/community-hardening-audit-v877.test.js`.

## Supporting overlap work

Overlap-era picker/popup work and duplicate community tracker labels remain valid repository hardening without reallocating the canonical numbers above. Historical issue/commit/test filenames carrying M869–M877 suffixes are supporting regressions only and do not redefine this block.

## M878 — Synchronize canonical state

- `ROADMAP.md`, post-merge qualification guidance, the runbook, qualification-state audit, and Issue #10 are synchronized with this combined browser/moderation community boundary.
- Duplicate milestone trackers were reconciled to supporting history so `ROADMAP.md` remains the single canonical allocator.
- M879 is the next canonical milestone.
- Issue #10 remains the authoritative exact-head Chromium + Firefox real-browser release gate.

## Evidence boundary

M869–M878 source/tests/audits/docs were created or reconciled through the GitHub connector and were **not executed locally or in browsers here**. `npm run check`, packaging, and real Chromium/Firefox observations were not run in this continuation. No browser or release qualification is claimed.

The privacy boundary is unchanged: no telemetry, analytics, browsing/request history, page/DOM snapshots, matched-element history, retained contribution statistics/history, user/device identifiers, GitHub token in the extension, or owned Drop Ads backend behavior.
