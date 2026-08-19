# Milestones 679–688 — Deterministic cosmetic policy hardening

This block returns from release-tooling work to the shipped cosmetic policy core. It does not change the privacy model: Drop Ads still retains no browsing/request history, matched-element history, statistics database, telemetry, analytics, user/device identifiers, or owned backend data.

## M679 — Locale-independent cosmetic ordering

Added `src/core/text-order.js` and routed cosmetic domain, canonical-rule, and selector ordering through fixed JavaScript code-unit comparison. Cosmetic canonical output no longer depends on `String.prototype.localeCompare` or host locale configuration.

## M680 — Immutable snapshots and exact stylesheet budgets

Normalized cosmetic rules now return frozen rule objects with frozen domain/exclusion arrays, and normalized collections are frozen. Matching operates directly on already-normalized rules instead of normalizing each rule again for hostname checks. Compiled selector duplicate admission uses Set membership instead of repeated linear array scans.

The compile `maxBytes` boundary now represents the exact CSS that can be emitted: selector bytes, `,\n` separators, and the final ` { display: none !important; }\n` suffix are included before a selector is admitted. This prevents a selector set from satisfying the compile budget but later exceeding it during stylesheet serialization.

## M681 — Direct stylesheet deduplication

`cosmeticStylesheet()` normalizes direct selector inputs and removes canonical duplicates in first-occurrence order before serialization. Duplicate caller entries therefore cannot waste stylesheet capacity or emit redundant selectors.

## M682–M686 — Focused regression locks

Added focused repository coverage for:

- accessor non-invocation, custom-prototype rejection, revoked-proxy rejection, and valid-neighbor survival during tolerant cosmetic collection normalization;
- zero-byte/zero-selector limits and exact multi-selector stylesheet byte boundaries;
- product precedence `personal allow > personal hide > shared allow > shared hide` under direct selector collisions;
- canonical parent/subdomain matching, excluded-domain subtree behavior, and domain-scoped allow/hide interaction;
- cosmetic rule-key canonicalization, sorted/deduplicated domains and exclusions, immutable parse results, non-canonical key rejection, and the derived key-length ceiling.

These tests are repository preflight coverage. They are not real-browser observations unless actually executed as part of an exact-head qualification run.

## M687 — Executable cosmetic hardening audit

Added `tools/cosmetic-hardening-audit.mjs` and wired `npm run cosmetic-hardening-audit` into `npm run check`. The audit protects the deterministic ordering, immutable snapshot, exact byte-budget, Set-membership, single-pass matching, direct stylesheet dedupe, and regression-coverage boundaries established in this block. It also forbids reintroduction of locale-sensitive cosmetic ordering and linear `target.includes()` duplicate scans.

## M688 — State synchronization

The roadmap, qualification guidance, current-state audit contract, and Issue #10 are synchronized to this block. Issue #10 remains open and authoritative for real Chromium + Firefox runtime qualification. Connector-created source/tests/audits/docs do not constitute browser execution or release qualification.

## Privacy and release boundary

M679–M688 add no telemetry, analytics, browsing/request history, matched-element retention, statistics database, identifiers, remote executable code, or owned service. The cosmetic engine remains declarative-only. Any real release claim still requires the exact-head Issue #10 browser matrix for both Chromium and Firefox.
