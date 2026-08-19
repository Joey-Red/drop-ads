# Cookie-banner collaborator ownership exact-head qualification

This checklist covers the M1032–M1039 cookie-banner collaborator-ownership hardening. It is supporting guidance only. **Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.** Repository tests, audits, fixtures, and generated qualification records do not substitute for real browser observations.

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

## Reject-mode controls

Set cookie-banner handling to **Reject cookie banners when possible**.

Verify the ordinary safe control still activates exactly once. Repeat representative reviewed localized controls from the action-source/localization fixtures, including at least one reject-all and one necessary-only positive route. This confirms that the descriptor-safe utility composition chain still exposes the final reviewed rejection scorer and action snapshot to the controller/executor rather than silently breaking positive behavior.

Then exercise representative fail-closed routes from the existing action-source/context/semantics fixtures, including:

- conflicting action names;
- navigation ancestry;
- hidden or unsupported action text;
- editable/popup/toggle context;
- busy/disclosure/controlled-region/command semantics;
- equal-top-score ambiguity;
- generic localized consent without strong cookie/privacy evidence.

Every negative route must remain untouched automatically.

## Open-shadow ownership observations

Use the existing main loopback cookie-banner scenario for the delayed open-shadow consent banner documented by M930. Confirm in both exact candidate browsers that:

- the delayed open-shadow strong cookie reject surface is discovered after insertion and activates in reject mode;
- a previously reachable open shadow root and a newly reachable root are each observed without duplicate visible activation;
- the same behavior remains bounded by the existing 2,000-node, 32-root, four-level shadow-discovery ceilings, 16 scan attempts, and 30-second observation deadline;
- closed shadow roots are not pierced;
- page reload starts from a fresh transient observer/target set rather than carrying a prior page decision.

These observations protect the M1036 descriptor-safe `createTreeWalker`, `TreeWalker.nextNode`, and native `shadowRoot` collaborator path as real browser behavior. The repository source/audits only prove that the intended boundary exists in source.

## Collaborator ownership expectations

The exact candidate should behave as though cookie-banner collaborators are captured once from extension-owned immutable boundaries:

- action-source wrapping composes only the `textSnapshot` slot through `DropAdsCookieBannerUtilsComposition`;
- consent safety uses the descriptor-snapshotted `boundedConsentContext` collaborator and exposes one immutable `isStrongConsentContainer` function;
- executor revalidation uses captured utility/consent collaborators and the captured native click/geometry/hit-test primitives;
- controller consumes the exact frozen executor, shadow-root, and consent-safety APIs and does not depend on later live property reads from those globals;
- shadow discovery uses captured DOM primitives and the immutable shadow helper API;
- malformed collaborator state must result in no automatic cookie-banner action rather than a fallback to looser page-owned behavior.

Do not treat DevTools/source mutation of the loaded extension as a qualification technique. Such mutation changes the candidate being observed. Qualification is against the exact packaged candidate and the observable safe/fail-closed scenarios above.

## Off-mode control

Set cookie-banner handling to **Off** and reload the safe base control, representative localized positive controls, and the delayed open-shadow scenario. None may activate automatically. Re-enable reject mode and verify the safe base/localized/open-shadow controls work again on fresh loads.

## Independence and privacy

While performing these observations, ordinary network/cookie/cosmetic blocking and site/session recovery must continue independently. The collaborator hardening must not persist or emit:

- utility/collaborator snapshots or failure details;
- action labels or accessible names;
- DOM/page/shadow-root snapshots;
- banner/click/request history or outcomes;
- locale/language profiles;
- statistics, timestamps, identifiers, analytics, or telemetry.

No owned Drop Ads backend or new external request is part of this qualification.

## Supporting preflight gates

`npm run qualify:preflight` includes the dedicated `cookie-banner-utils-composition-audit`, `cookie-banner-collaborator-ownership-audit`, localization audit, canonical cookie-banner hardening audit, test suite, build/package/reproducibility gates, and qualification-record checks. In particular, the canonical hardening audit carries the `extended through M1038` marker.

Those gates are necessary supporting evidence but are not Chromium/Firefox observation. Record real browser outcomes only through the guarded qualification workflow documented in `docs/QUALIFICATION_RUNBOOK.md`.
