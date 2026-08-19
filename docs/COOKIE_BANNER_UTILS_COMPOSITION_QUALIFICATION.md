# Cookie-banner utility composition qualification

This checklist covers the M1022–M1030 descriptor-safe cookie-banner utility-composition boundary. It is supporting guidance only; Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

## Prepare the exact candidate

From the exact source head being qualified:

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
node tools/cookie-banner-action-source-qualification-server.mjs
node tools/cookie-banner-localization-qualification-server.mjs
```

Load the exact generated Chromium package bound to the active qualification record, perform the observations below, then repeat with the exact generated Firefox package. Use only the printed `127.0.0.1` fixture URLs.

## Composition startup observations

With cookie-banner handling set to **Reject cookie banners when possible**:

- load the base action-source fixture `/control`; it must still activate and display its PASS status;
- load each localized positive control `/polish-control`, `/swedish-control`, `/danish-control`, `/norwegian-control`, `/finnish-control`, and `/czech-control`; each must still activate independently;
- exercise representative action-context and action-semantics negative routes such as `/editable-ancestor`, `/aria-haspopup`, `/busy-context`, `/controlled-region`, and `/command-target`; none may activate automatically;
- run every route in `cookie-banner-localization-qualification-server.mjs`: generic-consent and non-exact routes must remain untouched, necessary-only routes must activate when they are the best safe action, reject-over-necessary routes must select reject-all, and equal-top-score ambiguity routes must activate neither action;
- reload a representative positive and negative route after navigating between the two fixture servers. Behavior must not depend on a previously visited route, previously seen label, or previously observed score.

These observations exercise the composed utility chain after `cookie-banner-utils.js` → `cookie-banner-utils-composition.js` → localized scoring → action-source/context/semantics hardening. Repository audits verify the descriptor details; real-browser qualification verifies that the exact packaged chain still behaves correctly in both browser engines.

## Off-mode control

Set cookie-banner handling to **Off** and reload the base and localized positive controls. They must remain untouched. Negative routes must remain untouched as before. Restore reject mode and confirm the positive controls activate again on later isolated loads.

## Fail-closed contracts

The source/audit preflight must verify all of the following before browser observation is accepted:

- the shared utility object has the exact canonical own-key set, plain-object prototype, frozen data descriptors, and no accessor-backed entries;
- composition overrides are bounded, own-data-descriptor-only, and limited to existing canonical utility keys;
- localized scoring captures the base scorer and normalizer through the composition snapshot and replaces only `rejectionScore`;
- action-context and action-semantics layers capture and replace only `textSnapshot` through the composition helper;
- base rejection scores outside the safe-integer `0..100` range fail closed;
- normalized action-text collaborator output must be at most 160 characters, lowercase, trimmed, single-spaced, and in the canonical ASCII action grammar; empty string remains the no-match result;
- the localized phrase table is validated as exact frozen data-descriptor tuples and compiled into a frozen null-prototype lookup;
- localized matching remains exact, with reviewed 100/86 score classes and base-language precedence;
- Chromium and Firefox load the same cookie-banner script list in the same order.

Do not attempt to create page-visible or persistent diagnostics for these contracts. The dedicated `cookie-banner-utils-composition-audit`, `cookie-banner-localization-audit`, and canonical `cookie-banner-hardening-audit` are the preflight evidence.

## Privacy boundary

While qualifying the exact candidate, confirm there is no retained action label, accessible name, localized phrase, DOM/page snapshot, click result, route history, score outcome, locale/language profile, count, timestamp, identifier, analytics, or telemetry. Normal network/cookie/cosmetic blocking and existing site/session recovery controls must remain independent.

## Exact-head invalidation

Record observations only for the exact source fingerprint and generated package identities in the active qualification record. Any source commit, source fingerprint, archive hash/size, or candidate-record change invalidates prior observations; rebuild and repeat for both Chromium and Firefox rather than carrying results forward.
