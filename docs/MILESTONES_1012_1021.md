# Milestones 1012–1021 — Cookie-banner localization safety qualification

This sequence deepens the M1002–M1011 exact localization work without adding locale detection, telemetry, browsing history, action history, or any Drop Ads backend. Repository tests, audits, and loopback fixtures are supporting preflight evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.

## M1012 — Generic-consent false-positive matrix

Added `tools/cookie-banner-localization-qualification-server.mjs` with isolated Polish, Swedish, Danish, Norwegian, Finnish, and Czech routes that pair an exact reviewed reject-all label with generic consent wording but no strong cookie/privacy evidence. Every route must remain untouched automatically. The server is loopback-only, GET/HEAD-only, request/connection bounded, external-request free, and observation-free.

## M1013 — Exact-match negative matrix

Added strong localized cookie/privacy contexts whose reject-looking labels have extra prefix/suffix text. These routes must remain untouched, demonstrating that localized rejection uses exact canonical normalized equality rather than prefix, suffix, or substring matching.

## M1014 — Necessary-only positive controls

Added exact reviewed necessary-only controls for all six languages under matching strong cookie/privacy evidence. These lower-scored controls may activate in reject mode when they are the best unambiguous rejection action and must remain untouched when cookie-banner handling is off.

## M1015 — Reject-over-necessary priority controls

Added two-action routes containing a reviewed reject-all action and reviewed necessary-only action. Reject-all must win because its reviewed score is higher; automatic necessary-only activation is an explicit failure.

## M1016 — Equal-top-score ambiguity controls

Added routes with two reviewed reject-all actions at the same top score. The runtime must fail closed and activate neither action rather than selecting by DOM order.

## M1017 — Localized lexicon fail-closed validation

Hardened `src/content/cookie-banner-locale-extension.js` so localized scoring is available only when the immutable lexicon passes structural validation:

- at most 32 localized entries;
- each phrase at most 96 characters;
- outer list and each two-field tuple must be frozen arrays;
- each tuple is exactly `[phrase, score]`;
- only reviewed scores `100` and `86` are accepted;
- phrases must be duplicate-free;
- every stored phrase must already equal `normalizedActionText(phrase)`.

Base-language scoring is evaluated before the localized fail-closed gate, so a malformed localized lexicon cannot disable the existing base rejection lexicon.

## M1018 — Dedicated localization audit

Added `tools/cookie-banner-localization-audit.mjs` and wired `npm run cookie-banner-localization-audit` into `npm run check`. The audit protects the reviewed six-language lexicon, strong localized consent evidence, lexicon bounds/validation, Chromium/Firefox content-script order, zero locale/profile/persistence/network surface, and M1012–M1017 qualification regressions.

## M1019 — Canonical hardening audit extension

Extended `tools/cookie-banner-hardening-audit.mjs` through M1018 while preserving historical compatibility markers. It now requires the dedicated localization audit and fixture, M1012–M1018 regressions, validated localized lexicon, and the same zero-profile/zero-retention boundaries. The canonical marker now includes `extended through M1018`.

## M1020 — Exact-head qualification guidance

Extended `docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md` through M1019. Exact-head Chromium and Firefox qualification now runs both loopback servers and covers:

- generic localized consent false positives;
- non-exact localized action labels;
- necessary-only positive controls;
- reject-over-necessary priority;
- equal-top-score ambiguity;
- bounded localized lexicon validation and fail-closed behavior;
- reject/off-mode transitions;
- dedicated and canonical audit support;
- exact-head invalidation after any source/package identity change.

## M1021 — Canonical synchronization

Synchronized this sequence into `ROADMAP.md`, advanced the next canonical milestone to M1022, added the M1012–M1021 exact-head Chromium/Firefox qualification delta to Issue #10 without claiming a browser pass, and added roadmap regression coverage.

## Privacy and release boundary

The localization runtime and qualification tooling retain no action labels, accessible names, page/DOM snapshots, language or locale profile, click outcomes, scores, counts, timestamps, identifiers, analytics, telemetry, or learned decisions. No browser-language API selects behavior. All language support remains declarative exact-label logic under the same strong consent and action-safety gates.

Repository-created tests and audits in this sequence were not executed as real browser observations here. Chromium and Firefox release qualification remains blocked on actual exact-head observations recorded under Issue #10.
