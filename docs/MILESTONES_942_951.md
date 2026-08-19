# Milestones 942–951 — Per-site cookie-banner exclusions

This sequence adds a persistent site-level recovery control for automatic cookie-banner rejection without weakening ordinary network, cookie, or cosmetic protection.

## M942 — Persistent configured exclusion state
Added `cookieBannerDisabledSites` as a canonical configured domain set with the same 5,000-domain ceiling used by other site policy collections.

## M943 — Policy enforcement
Cookie-banner policy evaluation refuses automatic rejection when the current domain is directly or parent-domain covered by `cookieBannerDisabledSites`.

## M944 — Shared mutation helper
Added a storage-only canonical mutation helper that validates the boolean flag, normalizes the hostname, performs bounded domain-set mutation, skips redundant writes, and returns an immutable minimal result.

## M945 — Popup current-site control
Added **Reject cookie banners here** as an independent current-site toggle. It is hidden when global cookie-banner handling is off, participates in live storage synchronization/busy semantics, and affects future page loads without disabling ordinary protection.

## M946 — Keyboard discovery
Added the site-only `B` popup shortcut and matching exact help/ARIA routing for the native cookie-banner checkbox.

## M947 — Settings management
Added an accessible Settings editor for adding/removing persistent cookie-banner site exclusions by canonical hostname. Only configured domains are rendered; no browsing history is inferred or retained.

## M948 — Backup/import compatibility
Settings backups now include the bounded canonical exclusion set. Older v1 backups that omit it remain compatible and import an empty set. Session state and page/banner history remain excluded.

## M949 — Dedicated audit gate
Added `cookie-banner-site-exclusion-audit`, wired into `npm run check`, to protect configured-state bounds, policy gating, storage-only mutation, popup/keyboard/Settings UX, backup compatibility, and canonical regressions.

## M950 — Exact-head browser qualification guidance
Added `docs/COOKIE_BANNER_SITE_QUALIFICATION.md` tying the current-site exclusion cycle to the existing loopback immediate and delayed/open-shadow fixtures while requiring ordinary blocking to remain independently active.

## M951 — Roadmap and Issue #10 synchronization
Documented this canonical sequence, advanced the next milestone to M952, and added the exact-head Chromium/Firefox qualification delta to Issue #10. Repository tests/audits/guidance remain preflight/supporting evidence only.

## Privacy invariant
No part of this feature stores browsing/request history, page or DOM snapshots, banner/click outcomes, statistics, timestamps, identifiers, analytics, or telemetry. The only new persistent data is the user-configured canonical domain exclusion set.
