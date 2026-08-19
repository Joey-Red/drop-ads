# Milestones 829–838 — Element picker selector and save hardening

This block hardens the page-local element picker without adding telemetry, browsing/request history, page/DOM snapshots, retained selector history, statistics, identifiers, remote code, or any Drop Ads backend. Selector generation remains bounded declarative work and the final cosmetic rule remains an explicit local user action.

## M829 — Deterministic class selector identity

Picker class-list work is capped at 64 tokens. Accepted stable class tokens are deduplicated, fixed-code-unit sorted, and capped to three selected tokens so DOM class ordering cannot change selector identity. Canonical regression: `tests/selector-class-order-v829.test.js`.

## M830 — Revalidate picker selection immediately before saving

`picker-save-guard.js` verifies that the bounded preview selector still uniquely identifies the original connected target immediately before the cosmetic-rule runtime mutation. Detached, replaced, ambiguous, or otherwise stale selections fail locally and remain retryable instead of saving a rule for the wrong element. Chromium and Firefox load the guard after selector utilities and before picker runtime. Canonical regression: `tests/picker-save-revalidation-v830.test.js`.

## M831 — Require stable direct identity

A bare tag is not accepted as a one-part saved selector merely because it is unique in the current document. Direct selectors must carry reviewed identity; structural selectors still require either ancestry or identity-bearing current parts before exact-target uniqueness can succeed. Canonical regression: `tests/selector-direct-identity-v831.test.js`.

## M832 — Try every reviewed stable picker attribute

Picker identity uses a fixed reviewed attribute-name set (`data-testid`, `data-test-id`, `data-test`, `data-qa`, `data-cy`, `data-automation-id`, `role`, and `type`). Every admitted candidate is tried in deterministic review order before class/ancestry fallback rather than stopping at the first stable value. Canonical regression: `tests/picker-reviewed-attributes-v832.test.js`.

## M833 — Reject ephemeral and URL-shaped identity tokens

The shared bounded `stableToken` boundary rejects trim-loss, whitespace/control/bidi/default-ignorable hazards, URL/path/query/address-like delimiters, long hexadecimal identities, and long numeric runs before ids, reviewed attributes, or classes can contribute selector identity. Canonical regression: `tests/selector-ephemeral-token-v833.test.js`.

## M834 — Recover safely from duplicate ids

Stable-looking ids are used only when they uniquely identify the intended element. Duplicate target ids fall through to other reviewed target identity and bounded ancestry; ancestor ids are admitted only after their own exact uniqueness check. Canonical regression: `tests/selector-duplicate-id-v834.test.js`.

## M835 — Bound CSS-escape output expansion

The custom deterministic CSS escaping helper now enforces the 400-character selector ceiling while output is being constructed, not only against raw input length. Escape-heavy values fail closed before they can produce an oversized intermediate selector. Canonical regression: `tests/selector-css-escape-output-v835.test.js`.

## M836 — Bound selector uniqueness probes

One `generateStableSelector` call has an explicit 32-probe uniqueness-query budget shared by direct candidates, ancestor-id checks, and composed-selector checks. The separate one-shot M830 save-time exact-target verification remains outside that generation budget. Canonical regression: `tests/selector-uniqueness-budget-v836.test.js`.

## M837 — Executable picker hardening gate

`picker-selector-hardening-audit` is wired into `npm run check`. It enforces the canonical M829–M836 deterministic class identity, save-time exact-target verification, stable direct identity, reviewed attribute ordering, token hygiene, duplicate-id recovery, CSS-escape ceiling, uniqueness budget, manifest load order, focused regressions, and no-storage/no-network selector boundary. Canonical regression: `tests/picker-selector-hardening-audit-v837.test.js`.

## M838 — State synchronization

This milestone record, qualification documentation, executable current-state audit, and `ROADMAP.md` synchronize M829–M838 as the canonical element-picker block and advance the next canonical milestone to M839. Issue #10 remains the authoritative exact-head real Chromium + Firefox browser qualification gate.

## Supporting hardening retained on `main`

Overlapping continuation work also added useful picker protections such as stable class-list snapshot revalidation, shortest deterministic class-prefix candidates, rejection of Drop Ads-owned helper classes, additional invisible-token coverage, and duplicate-id focused regressions. These remain supporting coverage and do not allocate competing canonical milestone numbers.

## Canonical issue mapping

- M829: #1255
- M830: #1271
- M831: #1288
- M832: #1283
- M833: #1302
- M834: #1324
- M835: #1327
- M836: #1318
- M837: #1321
- M838: #1332

`ROADMAP.md` is the sole milestone-number authority. Useful source work produced by overlapping continuation attempts may remain as supporting or future backlog, but competing issue titles do not allocate a second canonical M829–M838 sequence.

## Evidence boundary

All M829–M838 work in this continuation was performed through the GitHub connector. Tests and audits were created or updated but were **not executed locally**, and no Chromium/Firefox browser observations were recorded. These commits therefore do not constitute release qualification.
