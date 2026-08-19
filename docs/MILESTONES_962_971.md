# Milestones 962–971 — Cookie-banner action-source identity and safety

This sequence hardens the text/naming boundary used before any automatic cookie-banner rejection action. The core privacy invariant remains unchanged: Drop Ads does not retain page, action-label, accessible-name, navigation, click, request, outcome, language-profile, statistic, timestamp, identifier, analytics, or telemetry data.

- **M962 — Direct label completeness.** Added `cookie-banner-action-source-safety.js` and Firefox/Chromium parity. Oversized input values and `aria-label` sources fail closed before canonical extraction.
- **M963 — Descendant label completeness.** A descendant action name must complete within 32 text nodes, 512 raw characters, and 160 normalized characters; a truncated prefix is never scored.
- **M964 — `aria-labelledby` completeness.** Referenced accessible names must fit the existing four-ID / 256-attribute / 16-node-per-reference / 256-reference-raw / 512-joined-raw / 160-normalized ceilings.
- **M965 — Direct/visible agreement.** When both naming channels exist, their canonical normalized action names must agree exactly.
- **M966 — `aria-labelledby` agreement.** A referenced accessible name that coexists with direct or visible naming must agree exactly; sole-source bounded `aria-labelledby` remains supported.
- **M967 — Navigation ancestry refusal.** Otherwise button-like actions nested in anchors, areas, href/formaction carriers, or `role=link` containers fail closed across at most 16 composed ancestors, including open shadow-host boundaries.
- **M968 — Canonical audit extension.** `cookie-banner-hardening-audit` now covers the action-source layer, updated manifest order, M962–M967 regressions, and the zero persistence/network/language-profile boundary while preserving earlier canonical audit markers.
- **M969 — Loopback fixture.** Added a `127.0.0.1`-only action-source qualification server with a safe control plus isolated overflow, naming-conflict, and navigation-ancestry cases.
- **M970 — Exact-head guide.** Added `docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md` for reject/off observations in both exact candidate browsers.
- **M971 — Synchronization.** ROADMAP and Issue #10 qualification requirements are synchronized and canonical numbering advances to M972.

Repository tests, audits, fixtures, and documentation are preflight/supporting evidence only. They are not Chromium or Firefox observations. Issue #10 remains the authoritative exact-head real-browser release gate.
