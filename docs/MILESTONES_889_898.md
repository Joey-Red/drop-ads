# Milestones 889–898 — Reviewed community issue moderation hardening

This canonical block strengthens the existing optional, user-reviewed GitHub contribution flow without introducing a Drop Ads backend, embedded GitHub token, telemetry, browsing/request history, retained contribution history, or automatic merge.

## M889 — Require explicit review attestations

- The generated community issue's two privacy/review assertions must each appear exactly once and be checked before automated validation can accept the issue as reviewed.
- Missing, unchecked, duplicated, or altered attestations fail closed.
- Canonical regression: `tests/community-review-attestations-v889.test.js`.

## M890 — Require a human blocking rationale

- The generated placeholder comment must be replaced by a human reason before reviewed validation succeeds.
- Empty/template rationale does not become a promotion candidate.
- Canonical regression: `tests/community-review-rationale-v890.test.js`.

## M891 — Bound rationale work

- Human rationale is constrained to a small reviewed character range and rejects unsupported controls.
- Rationale text is validated for presence only; it is not returned in validator/workflow output or persisted by Drop Ads.
- Canonical regression: `tests/community-review-rationale-bounds-v891.test.js`.

## M892 — Reject ambiguous review sections

- Review, rationale, and privacy headings must each occur exactly once and in the generated order.
- Duplicate/reordered sections fail closed rather than creating ambiguous moderation semantics.
- Canonical regression: `tests/community-review-sections-v892.test.js`.

## M893 — Bind the issue title to the validated candidate

- The reviewed issue title must exactly equal `[Community block] <validated-domain>`.
- Title/body candidate drift therefore fails before workflow acceptance or promotion.
- Canonical regression: `tests/community-review-title-v893.test.js`.

## M894 — Route issue validation through the reviewed boundary

- `check-community-submission.mjs` uses the reviewed-body gate and exact title/candidate binding before workflow output serialization.
- Existing bounded community-list validation remains authoritative after review checks pass.
- Canonical regression: `tests/community-reviewed-validation-cli-v894.test.js`.

## M895 — Bind GitHub issue validation to exact title and body

- The validation workflow passes the current issue title and body into the reviewed validator on opened/edited events.
- Passing validation now means the candidate is canonical/public and the required review attestations/rationale are present; it still does not promote automatically.
- Canonical regression: `tests/community-reviewed-validation-workflow-v895.test.js`.

## M896 — Require reviewed context again at promotion time

- The maintainer-approved promotion CLI revalidates review/body/title state immediately before promotion work.
- Promotion remains serialized per issue and still requires explicit human PR review/merge.
- Canonical regression: `tests/community-reviewed-promotion-workflow-v896.test.js`.

## M897 — Enforce the reviewed-community hardening gate

- `community-review-hardening-audit` enforces the generated review contract, bounded rationale, unique section ordering, title binding, validation/promotion CLI routing, workflow title/body handoff, and the canonical M889–M896 regressions.
- The audit is wired into `npm run check` as repository preflight.
- Canonical regression: `tests/community-review-hardening-audit-v897.test.js`.

## M898 — Synchronize canonical state

- This record, `ROADMAP.md`, qualification guidance/state, and Issue #10 are synchronized with M899 declared next.
- Any browser observations from an older source head remain invalid after these source commits.

## Evidence boundary

M889–M898 work was created through the GitHub connector. Connector-created tests/audits were **not executed locally or in browsers here**; `npm run check` and GitHub Actions are not claimed as run. No Chromium/Firefox runtime observation or release qualification is claimed. Issue #10 remains the authoritative exact-head real-browser gate.
