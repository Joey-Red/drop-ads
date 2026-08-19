# Milestones 1002–1011 — Expanded exact cookie-banner localization

This sequence expands reviewed cookie-banner rejection coverage without adding locale detection, language profiling, telemetry, page history, or retained action outcomes. Matching remains exact after the existing deterministic normalization path, and real Chromium + Firefox qualification remains governed by Issue #10.

## M1002 — Polish exact rejection labels

Added a small immutable localization layer after the base cookie-banner utilities. Reviewed Polish reject-all and necessary-only labels are scored only by exact normalized equality, after preserving the existing base rejection score first.

## M1003 — Swedish exact rejection labels

Added reviewed Swedish reject-all and necessary-only labels to the same exact-match localization layer. No browser-language or locale selection is performed.

## M1004 — Danish exact rejection labels

Added reviewed Danish reject-all and necessary-only labels with unchanged base/language precedence and exact normalized matching only.

## M1005 — Norwegian exact rejection labels

Added reviewed Norwegian reject-all and necessary-only labels. The implementation retains no per-page or per-language decision state.

## M1006 — Finnish exact rejection labels

Added reviewed Finnish reject-all and necessary-only labels. Existing deterministic NFKD/combining-mark folding handles reviewed Latin diacritics without locale-sensitive APIs.

## M1007 — Czech exact rejection labels

Added reviewed Czech reject-all and necessary-only labels while preserving the same exact-match and fail-closed source-safety boundaries.

## M1008 — Strong localized consent evidence

Expanded strong consent-context evidence with specific cookie/privacy-choice terms for Polish, Swedish, Danish, Norwegian, Finnish, and Czech. Generic consent, vendor, or personal-data wording remains insufficient by itself. Existing bounded context work and pre-click strong-consent revalidation remain authoritative.

## M1009 — Canonical audit through M1008

Extended `tools/cookie-banner-hardening-audit.mjs` to require the localization layer, exact reviewed labels, localized strong-consent evidence, Chromium/Firefox script-order parity, no locale/profile/network/persistence surface, and all M1002–M1008 regression files. The audit remains wired into `npm run check` and is preflight evidence only.

## M1010 — Loopback localized positive controls

Extended `tools/cookie-banner-action-source-qualification-server.mjs` with isolated positive controls for Polish, Swedish, Danish, Norwegian, Finnish, and Czech. Each route combines one reviewed exact reject-all label with matching strong localized cookie/privacy evidence and reports a visible local PASS only when automatic rejection activates. The server remains `127.0.0.1`-only, GET/HEAD-only, bounded, external-request-free, and observation-free.

## M1011 — Exact-head guidance and roadmap synchronization

Updated the action-source qualification guide, canonical roadmap, and Issue #10 qualification delta for the expanded localization sequence. The six localized positive controls must activate only in reject mode on the exact generated Chromium and Firefox candidates; off mode must leave them untouched. Generic non-cookie consent must remain fail-closed even when it contains reject-looking localized text.

## Privacy and qualification boundary

The sequence stores no action labels, accessible names, page/DOM snapshots, language or locale profile, click history, counts, timestamps, identifiers, analytics, telemetry, or learned outcomes. It does not use `navigator.language`, `navigator.languages`, or locale-sensitive `Intl` selection.

Repository tests, audits, and loopback fixtures are supporting preflight evidence only. They do not establish a browser pass. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate, and any source/package identity change invalidates earlier browser observations.
