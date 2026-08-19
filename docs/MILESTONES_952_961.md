# Milestones 952–961 — Cookie-banner localization and accessible-name hardening

This sequence expands best-effort automatic cookie-banner rejection beyond English while keeping activation conservative, bounded, accessible, and privacy-minimal.

## M952 — Exact multilingual reject labels
Added a small reviewed exact-match lexicon for common reject-all/refuse-all labels in German, French, Spanish, Italian, Portuguese, and Dutch. Matching remains exact normalized equality only.

## M953 — Bounded same-root `aria-labelledby`
Added an accessible-name fallback for controls with no direct value, `aria-label`, or descendant text. At most four unique references are resolved, reference attributes/text are bounded, and every reference must stay in the action's own Document/ShadowRoot. The resolved label is re-read during pre-click validation.

## M954 — Safe label-reference targets
Referenced accessible-name nodes must be connected, non-Drop-Ads-owned, and non-interactive. Links, buttons, inputs, selects, textareas, and role=button/link nodes cannot supply the automatic rejection label.

## M955 — Multilingual strong consent evidence
Added reviewed specific privacy-choice/tracking phrases in German, French, Spanish, Italian, Portuguese, and Dutch. Generic consent, personal-data, vendor, or CMP wording remains insufficient by itself.

## M956 — Multilingual positive/ambiguous refusal
Common accept/allow/preferences/settings terms in the same languages now suppress automatic activation. They never produce a rejection score.

## M957 — Deterministic diacritic folding
Bounded action labels now use Unicode NFKD plus combining-mark removal before the existing ASCII action grammar. No locale or browser-language inspection is performed.

## M958 — Exact multilingual necessary-only labels
Added conservative exact-match necessary-only labels for the same language set, scored below reject-all/refuse-all actions and still subject to strong consent evidence plus all activation revalidation.

## M959 — Canonical audit extension
`cookie-banner-hardening-audit` now protects M952–M958 and requires the new regressions while preserving all earlier canonical audit compatibility markers and `npm run check` wiring.

## M960 — Loopback localization/accessibility fixture
Added `tools/cookie-banner-accessibility-qualification-server.mjs`. Its isolated loopback routes cover six reviewed languages, an accented necessary-only label, safe same-root `aria-labelledby`, unsafe interactive label refusal, and a generic non-cookie consent negative control. It records nothing and makes no external requests.

Run it directly for manual exact-head observation:

```sh
node tools/cookie-banner-accessibility-qualification-server.mjs
```

Then visit the printed `127.0.0.1` URL using the exact Chromium or Firefox candidate package bound to the active qualification record.

## M961 — Roadmap and qualification synchronization
Documented this canonical sequence, advanced the next canonical milestone to M962, and added the exact-head Chromium/Firefox observation delta to Issue #10. Repository tests, audits, and fixtures remain supporting/preflight evidence only.

## Privacy and safety invariant
No localization/accessibility behavior stores page text, language preference, accessible names, banner/click outcomes, browsing/request history, timestamps, statistics, identifiers, analytics, or telemetry. Discovery and accessible-name values exist only transiently within the bounded content-script run.
