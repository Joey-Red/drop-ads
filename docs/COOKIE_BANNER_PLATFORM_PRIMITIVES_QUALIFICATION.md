# Cookie-banner platform primitive exact-head qualification

This checklist covers the M1042–M1049 cookie-banner platform-primitive hardening. It is supporting guidance only. **Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.** Repository tests, audits, fixtures, and generated qualification records do not substitute for real browser observations.

## Prepare the exact candidate

From the exact source head being qualified:

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
npm run qualify:serve
node tools/cookie-banner-action-source-qualification-server.mjs
node tools/cookie-banner-localization-qualification-server.mjs
```

Load only the exact generated Chromium package bound to the active qualification record, complete the observations below, then repeat with the exact Firefox package. A source commit, source fingerprint, generated package hash/size, or active-candidate record change invalidates the observations.

## Safe reject-mode behavior

Set cookie-banner handling to **Reject cookie banners when possible**.

Verify the ordinary safe control activates exactly once. Repeat representative reviewed localized positive controls, including at least one reject-all and one necessary-only route. Safe activation must still pass through the captured semantic, visibility, geometry, accessible-name, context, and action-semantics boundaries rather than becoming inert because of the hardening.

For visible safe controls verify that ordinary layout and viewport geometry still allow the center hit-test ownership check to succeed. Moving, hiding, covering, disabling, disconnecting, or making the control pointer-inert before activation must leave it untouched.

## Semantic and geometry refusal observations

Exercise representative existing negative scenarios so both exact candidate browsers confirm that:

- hidden, inert, `aria-hidden`, `aria-disabled`, and disabled fieldset contexts remain untouched;
- `display:none`, hidden/collapsed visibility, zero opacity, `pointer-events:none`, zero-area geometry, or covered controls remain untouched;
- a moved or newly covered control fails the final pre-click hit revalidation;
- ordinary visible controls remain compatible with captured `getComputedStyle`, bounding-rect, DOMRect, and viewport reads.

The M1042–M1043 source audits verify the intended descriptor boundary; these browser observations verify behavior of the packaged candidate.

## Action-source observations

Use the existing action-source qualification fixture to verify both positive and fail-closed accessible-name behavior:

- ordinary direct visible labels continue to work;
- reviewed input `value` and `aria-label` channels work only when independently bounded and mutually consistent;
- bounded same-root `aria-labelledby` labels continue to work when safe;
- missing, self, cross-root, duplicate, interactive, Drop Ads-owned, hidden-text, over-budget, bidi/invisible, mixed-script, or conflicting naming sources remain untouched;
- nested navigation ancestry remains untouched, including across open-shadow host ancestry.

These scenarios exercise the captured tree-walker, attribute, node-value, root, shadow-host, same-root ID lookup, and input-value primitives without treating source inspection as browser evidence.

## Action-context observations

Exercise representative action-context negative routes and confirm automatic activation remains fail-closed for:

- secondary activation ancestry such as nested labels, summaries, controls, links, and navigation carriers;
- inherited or explicit editable contexts and editable action descendants;
- editable `aria-labelledby` targets or descendants;
- `aria-haspopup` popup launch semantics;
- `aria-pressed`, `aria-checked`, and reviewed toggle roles;
- `popovertarget` or `popovertargetaction`.

A normal non-editable, non-popup, non-toggle, non-popover safe control must remain compatible.

## Action-semantics observations

Exercise representative semantics-negative routes and confirm automatic activation remains fail-closed for:

- `aria-expanded` disclosure actions;
- native reset buttons/inputs;
- conflicting native control roles;
- `aria-busy` other than exact `false` on the candidate or within the bounded composed ancestry;
- `aria-controls`;
- declarative `command`, `commandfor`, `invokeaction`, or `invoketarget` attributes.

A normal button-like reject control with settled/missing busy state and no secondary command/disclosure semantics must remain compatible.

## Delayed open-shadow behavior

Use the existing delayed open-shadow cookie-banner scenario documented by M930. In both exact candidate browsers confirm that a newly inserted open-shadow strong-cookie reject surface is discovered and activates in reject mode while the documented 2,000-node, 32-root, four-depth, 16-attempt, and 30-second ceilings remain behaviorally bounded. Closed shadow roots must not be pierced.

The platform hardening must not break the already-captured shadow discovery, shadow host ancestry, or open-shadow hit-test path.

## Off-mode control

Set cookie-banner handling to **Off** and reload the safe base control, representative localized positives, accessible-name positive, and delayed open-shadow scenario. None may activate automatically. Re-enable reject mode and verify the same safe controls work again on fresh loads.

## Exact-head and mutation boundary

Do not mutate the loaded extension or browser platform prototypes in DevTools and call that a qualification result: doing so changes the candidate under observation. The source-level M1042–M1049 regressions and `cookie-banner-platform-primitives-audit` are preflight evidence that the intended descriptor-safe boundary exists. Real qualification is the observable behavior of the exact generated package recorded under Issue #10.

Any source commit, source-fingerprint change, package hash/size change, or active qualification-record mismatch invalidates prior observations.

## Independence and privacy

Ordinary network, cookie, and cosmetic blocking plus site/session recovery must continue independently. Platform-primitive hardening must not persist or emit:

- DOM nodes, page text, accessible names, or action labels;
- computed styles, rectangles, viewport geometry, hit-test results, or shadow roots;
- platform primitive/collaborator snapshots or failure details;
- banner, click, request, or browsing history;
- locale/language profiles;
- statistics, timestamps, identifiers, analytics, or telemetry.

No owned Drop Ads backend or new external request is part of this qualification.

## Supporting preflight gates

`npm run qualify:preflight` includes `cookie-banner-utils-composition-audit`, `cookie-banner-collaborator-ownership-audit`, `cookie-banner-platform-primitives-audit`, the localization audit, the canonical cookie-banner hardening audit, the repository test suite, and build/package/reproducibility/qualification-record gates. The canonical cookie-banner hardening audit carries the compatibility marker `extended through M1048`.

Those gates are necessary supporting evidence only. Record real Chromium and Firefox outcomes through the guarded workflow in `docs/QUALIFICATION_RUNBOOK.md` and Issue #10.
