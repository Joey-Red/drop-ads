# Cookie-banner base utility platform exact-head qualification

This checklist covers the M1052–M1059 base `cookie-banner-utils.js` platform hardening. It is supporting guidance only. **Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.** Repository tests, audits, fixtures, and generated qualification records do not substitute for real packaged-browser observations.

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

Load only the exact generated Chromium package bound to the active qualification record, complete the observations below, then repeat them with the exact Firefox package. A source commit, source fingerprint, package hash/size, or active candidate-record change invalidates the observations.

## Safe positive controls

Set cookie-banner handling to **Reject cookie banners when possible** and verify on fresh loads:

- the ordinary safe base reject control activates exactly once;
- a representative reviewed localized reject-all control activates under matching strong cookie/privacy evidence;
- a representative necessary-only positive control remains lower priority than reject-all when both are present;
- a safe direct `aria-label` control, a safe input `value` control, a safe bounded descendant-text control, and a safe same-root `aria-labelledby` control continue to resolve the reviewed action identity;
- ordinary light-DOM consent discovery remains bounded and functional;
- the documented delayed open-shadow positive scenario remains discoverable without piercing closed roots.

These observations confirm that descriptor-captured base DOM primitives still preserve intended behavior instead of merely failing closed everywhere.

## Action-name and control negatives

Verify representative existing negative fixture routes remain untouched automatically, including:

- conflicting direct/visible/`aria-labelledby` names;
- oversized action-name sources;
- hidden or unsupported-script action text;
- unsafe, interactive, cross-root, duplicate, or over-budget `aria-labelledby` references;
- anchor/area/href/formaction navigation carriers and native submit controls;
- disabled native controls and `aria-disabled="true"` role buttons;
- Drop Ads-owned candidate descendants/controls;
- nested interactive descendants and navigation ancestry.

The base utility layer now reads input/button state, attributes, tags, connectivity, roots, and accessible-name references through captured exact-receiver primitives; the later action-source layer still provides the stricter anti-spoofing boundary.

## Consent-context observations

Verify:

- strong cookie/privacy evidence inside a bounded local consent container still permits a reviewed reject action;
- generic non-cookie consent remains untouched;
- consent discovery does not climb through the document body/document element as a valid consent container;
- large consent text and metadata remain bounded by the existing 96 text nodes, 1,200 normalized context characters, 2,400 raw characters per metadata field, 10 ancestor steps, and 256 context evaluations per scan;
- unrelated page text outside the bounded local consent context does not make an otherwise unsafe candidate eligible.

## Shadow/discovery observations

Use both light-DOM and delayed open-shadow scenarios. Confirm:

- candidate discovery stays within the existing 2,000 visited nodes and 64 candidate ceiling;
- open-shadow traversal stays within 32 roots and four shadow levels;
- the same reachable open root is not visibly processed as duplicate activation;
- closed roots are not pierced;
- a fresh page load starts with fresh transient discovery state.

The repository M1059 audit verifies the intended captured `Document.createTreeWalker`, `TreeWalker.nextNode`, `Element.shadowRoot`, node/root/attribute/control collaborators in source. Only these packaged-browser observations verify the behavior in Chromium and Firefox.

## Context and semantics negatives

Repeat representative action-context and action-semantics negatives from the existing fixtures:

- editable ancestry/descendants;
- popup/toggle/popover semantics;
- disclosure/reset/native-role/busy/controlled-region/declarative-command semantics;
- equal-top-score ambiguity.

All must remain untouched automatically. This protects the composition order: descriptor-safe base utilities first, then localized scoring/action-source/context/semantics wrappers, then consent/executor/controller ownership.

## Off-mode control

Set cookie-banner handling to **Off** and reload the safe base, representative localized, accessible-name, and delayed open-shadow positive routes. None may activate automatically. Re-enable Reject mode and confirm those same positive routes work again on fresh loads.

## Independence and privacy

Ordinary network/cookie/cosmetic blocking and site/session recovery must remain independent. The base utility platform hardening must not persist or emit:

- DOM/page/action/accessibility-name/consent text snapshots;
- input/button state, attributes, roots, shadow-root state, or traversal state;
- page/banner/click/request history or action outcomes;
- locale/language or platform profiles;
- statistics, timestamps, identifiers, analytics, or telemetry.

No owned Drop Ads backend or new external request is part of this qualification.

## Supporting preflight gate

`npm run qualify:preflight` reaches `npm run check`, which includes:

```sh
npm run cookie-banner-utils-composition-audit
npm run cookie-banner-utils-platform-audit
npm run cookie-banner-collaborator-ownership-audit
npm run cookie-banner-platform-primitives-audit
npm run cookie-banner-hardening-audit
npm run cookie-banner-localization-audit
```

The dedicated M1059 audit emits:

`cookie-banner-utils-platform-audit: canonical M1052-M1058 base utility platform invariants verified`

That marker is preflight evidence only, not a browser pass. Record real outcomes only through the guarded workflow in `docs/QUALIFICATION_RUNBOOK.md` and Issue #10.
