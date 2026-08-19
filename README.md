# drop-ads

`drop-ads` is the working repository for a privacy-first, browser-local blocker for **Firefox and Chromium**. The product name is still a placeholder.

The project combines a browser-attached Pi-hole-style network blocker with a deliberately bounded declarative cosmetic-filtering layer. Network requests, cookies, and selected page elements are handled locally; features that would require collecting browsing/request history remain out of scope.

## Non-negotiable privacy model

- **No telemetry. Ever.** No analytics, browsing history, request history, matched-element history, identifiers, fingerprints, or tracking backend.
- **No retained statistics database.** Drop Ads does not store per-request logs, lifetime blocked totals, per-site history, or timestamps. A planned per-tab blocked-request badge may use the browser's own DNR action count without exposing individual matched requests to Drop Ads.
- **No account required for blocking.** Personal rules, site exceptions, cosmetic rules, and cookie controls are local browser state.
- **No cookie-jar inspection.** Cookie protection is implemented with declarative header rules rather than enumerating or storing cookies.
- **No writable GitHub credential in the extension.** Community contribution opens GitHub in the browser; repository automation lives on GitHub.
- **User control wins.** Personal allow rules override personal blocks, which override shared/community policy. Personal cosmetic exceptions likewise outrank personal/shared cosmetic hides.

See [Privacy architecture](docs/PRIVACY.md) and [Browser permissions](docs/PERMISSIONS.md) for the enforced details.

## Current developer-build capabilities

- Firefox + Chromium Manifest V3 builds from one shared source tree
- domain/subdomain blocking, exact URL blocking, and URL-pattern rules
- resource-type-scoped rules
- personal blocklist and allowlist
- one-click **Block ad/resource locally** context action that blocks the resource domain by default
- advanced context submenu for exact-URL or explicit domain blocking
- global blocking toggle
- persistent per-site disable plus session-only pause for breakage recovery
- third-party cookie blocking by default
- optional all-cookie hard mode and local cookie exceptions
- Drop Ads community list plus enabled-by-default **HaGeZi Pro mini**
- optional built-in **StevenBlack Unified Hosts**, **Block List Project — Ads**, and **anudeepND Adservers** subscriptions, all disabled by default until the user opts in
- user-added external HTTPS filter-list subscriptions
- basic third-party declarative cosmetic rules (`##` and `#@#`) with bounded local application
- personal site-scoped cosmetic hide/exception rules
- popup **Pick element to block** flow with local preview and explicit site-scoped confirmation
- 12-hour automatic refresh, compact offline cache, rule-budget validation, transactional activation, and last-known-good rollback
- optional GitHub community submission; automatic preparation is **OFF by default**
- strict GitHub moderation validation and maintainer-gated promotion PRs; nothing auto-merges into the production list
- privacy-safe local settings backup/restore with transactional activation
- privacy/permission audits, unit/runtime contract tests, build/smoke/package tooling
- dependency-free loopback-only real-browser qualification fixture for repeatable Firefox/Chromium checks

The extension deliberately does **not** maintain a request-history database or statistics dashboard.

## Requested next features

The next documented feature block is tracked as Milestones 59–62:

- **Broader reviewed filter compatibility:** the three straightforward hosts-style sources above are now available as opt-in built-ins. EasyList/EasyPrivacy and AdGuard Filters remain high-priority compatibility targets because their richer network/cosmetic syntax needs a deliberate parser, license, overlap, browser-budget, and breakage review before becoming built-ins.
- **Country/region blocking:** start with explicit user-selected country-code TLD policy (for example `.ru` or `.cn`) with main-frame-only and/or all-resource modes. The UI must say clearly that ccTLD blocking is not physical server geolocation. No remote IP-geolocation service will be introduced.
- **Privacy-safe blocked-request count:** prefer the browser-native per-tab DNR action count rather than matched-rule feedback, URL logging, or a Drop Ads statistics database.
- **Immediate post-block cleanup:** after **Block ad/resource locally** successfully commits, immediately hide/neutralize the explicitly selected image/media/frame/link/container when the current DOM target can be safely identified. Keep the existing `↻` refresh-needed cue only as a fallback for resources that cannot be safely cleaned up or effects that cannot be undone after execution.

See [Requested feature designs](docs/REQUESTED_FEATURES.md) and [Development roadmap](ROADMAP.md) for the detailed privacy, failure, and qualification requirements for these features.

## Quick developer build

```sh
npm run check
npm run package
```

This creates unpacked Firefox/Chromium builds and developer packages under `dist/`. See [Developer sideloading](docs/SIDELOAD.md) for browser-specific loading steps.

For the release-gate browser pass, start the local deterministic fixture with:

```sh
npm run qualify:serve
```

Then follow [Real-browser qualification](docs/QUALIFICATION.md). The fixture is local-only preflight infrastructure; it does not turn repository tests into a browser qualification result by itself.

## Filter lists and community rules

Drop Ads can use its native network-list format and conservatively import supported third-party/hosts syntax. Remote lists are treated as hostile input: HTTPS is required, redirects are rejected, downloads are size-bounded, rules are normalized before activation, and a failed update keeps the last-known-good rules.

Useful references:

- [Filter sources](docs/FILTER_SOURCES.md)
- [Native list format](docs/LIST_FORMAT.md)
- [Community contribution and moderation](docs/COMMUNITY.md)
- [Privacy architecture](docs/PRIVACY.md)
- [Requested feature designs](docs/REQUESTED_FEATURES.md)
- [Browser permissions](docs/PERMISSIONS.md)
- [Developer sideloading](docs/SIDELOAD.md)
- [Real-browser qualification](docs/QUALIFICATION.md)
- [Development roadmap](ROADMAP.md)

## Release status

This is still a **developer/sideloaded build**, not a finished store release. The automated repository tests, source audits, build, artifact audit, and smoke checks are passing; real Firefox and Chromium runtime qualification remains the authoritative release gate documented in [Real-browser qualification](docs/QUALIFICATION.md).

Store signing, permanent end-user packaging, and final product naming come later.

## Later roadmap

Later work also includes reject-all cookie-banner automation, richer picker undo/preview controls, carefully scoped procedural filtering, scriptlets/anti-adblock handling after a separate executable-code threat-model review, and advanced/power-user rule controls. Those features must preserve the same no-history/no-telemetry architecture.

## License and contributions

Copyright 2026 Joey Dalrymple.

The project is licensed under the **PolyForm Noncommercial License 1.0.0** as described in [LICENSE.md](LICENSE.md). Noncommercial use, modification, and redistribution are permitted according to that license; commercial use requires separate permission from the copyright holder.

Outside contributions are governed by [CONTRIBUTING.md](CONTRIBUTING.md) and [CONTRIBUTOR_TERMS.md](CONTRIBUTOR_TERMS.md), which preserve the copyright holder's ability to relicense the project later.
