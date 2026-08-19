# Milestones 290–294 — UI response outcome boundaries

This block tightens browser-owned response handling at the popup and Settings UI boundaries. The goal is not to change product behavior; it is to make already-reviewed success/failure contracts unambiguous before UI code consumes them.

## Milestone 290 — Strict popup runtime outcome envelopes

`unwrapPopupRuntimeResponse()` still accepts only an exact ordinary/null-prototype own-data root with reviewed `ok`, `result`, and `error` names, and `ok` remains a real boolean. The discriminator now also controls field presence:

- successful replies may omit or provide `result`, but `error` must be absent;
- failed replies may omit or provide `error`, but `result` must be absent;
- explicitly present `undefined` still counts as present and is rejected on the opposite branch.

Accessor/custom-prototype/unknown-field rejection and caller fallback errors remain unchanged.

## Milestone 291 — Strict generic Settings runtime outcome envelopes

The shared generic Settings response boundary now applies the same discriminator-driven exclusivity. Successful replies may carry the generic detached `result`; failed replies may carry only the reviewed error field. A response cannot represent success and failure simultaneously by mixing companion fields.

The existing generic-result snapshot, 32-field work bound, personal-rule specialization, null-prototype support, and descriptor-safe field reads remain intact.

## Milestone 292 — Strict action-specific Settings outcome envelopes

The simple, subscription, refresh, and import Settings response boundaries now validate relationships between `ok` and their action-specific success fields:

- simple success contains no `error`;
- subscription success requires `subscription` and no `error`; failure cannot contain `subscription`;
- refresh success requires a reviewed `status` and no `error`; failure cannot contain `status`;
- import success requires reviewed `subscriptions` and `fetchedSources` counts and no `error`; failure cannot contain either success field.

Presence is significant even when a value is `undefined`. Existing nested subscription schemas, source/status enums, title limits, import count limits, and fallback errors are unchanged.

## Milestone 293 — Personal-rule result relational invariants

The already-exact personal-rule result envelope now enforces relationships matching the background runtime contract:

- `changed: false` requires `rule: null` and `communitySubmission: "not-requested"`;
- `changed: true` requires a non-null rule result;
- `personalAllow` always requires `communitySubmission: "not-requested"`;
- changed `personalBlock` results continue to accept only the reviewed `not-requested`, `not-eligible`, `prepared`, or `failed` statuses.

The rule payload is not dereferenced by this UI boundary. Settings still receives only the minimal frozen `{ communitySubmission }` view it needs.

## Milestone 294 — Documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to this block without changing release readiness. The exact branch head is recorded on Issue #10 rather than hardcoded into PR metadata.

## Validation status

The regression edits associated with Milestones 290–294 are **repository coverage only** in this connector session. No claim is made that `npm ci`, `npm run check`, packaging, release/reproducibility verification, source qualification, or Chromium/Firefox runtime qualification was executed here.

PR #7 must remain draft until the clean exact-head preflight/package sequence and the real Chromium + Firefox matrix in Issue #10 are completed against the same source/package hashes.

## Privacy invariants

No milestone in this block adds telemetry, analytics, browsing/request history, retained match statistics, page/DOM or matched-element history, identifiers, a custom backend, new permissions, or remote executable code. Blocking, cookie, cosmetic, community, storage, and recovery semantics are unchanged.
