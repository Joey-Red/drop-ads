# Requested feature designs

This document records requested product additions that preserve Drop Ads' privacy-first architecture. Implementation issues remain linked so native-browser qualification does not get confused with repository implementation.

## Milestone 59 — additional upstream blocklists

Tracking issue: #64 — implementation complete; native-browser qualification remains in #10.

Three opt-in built-ins are available beyond HaGeZi: StevenBlack Unified Hosts, Block List Project Ads, and anudeepND Adservers. `npm run qualify:sources` exercises current live third-party built-ins through the production bounded parser and reports supported counts/overlap without dumping rule values. EasyList/EasyPrivacy and AdGuard Filters remain richer-syntax compatibility candidates.

## Milestone 60 — country/region blocking

Tracking issue: #65 — implementation complete; native-browser qualification remains in #10.

Settings expose ccTLD suffix policy through the normal transactional personal-block engine. Presets cover ISO country/territory regions with `.uk` for the United Kingdom; custom two-letter and IDN ccTLD labels are supported. Navigation-only and All-resources modes inherit personal-allow precedence, site/session recovery, global disable, DNR budget preflight, rollback, and settings backup. This is explicitly not physical GeoIP and adds no geolocation service/history/backend.

## Milestone 61 — privacy-safe protection-action count

Tracking issue: #66 — implementation complete; native-browser qualification remains in #10.

Where supported, the browser-native declarativeNetRequest extension-action count paints the current-tab aggregate on the toolbar badge. Drop Ads never receives individual matched requests merely to calculate it. Settings can hide the badge without disabling blocking; the preference is local UI state and does not create per-site/lifetime statistics. The UI labels it **Protection actions** because cookie/header and other declarative actions may contribute to browser semantics.

## Milestone 62 — immediate cleanup after explicit context blocking

Tracking issue: #67 — implementation complete; native-browser qualification remains in #10.

A reviewed static content script now remembers only the most recent explicit context-menu resource target in its own frame for up to ten seconds. The background still commits the normal personal network block first. Only after committed state proves the block exists does it send the exact target URL back to the originating frame for in-place cleanup. A repeated block that was already committed is also eligible for cleanup without pretending a failed new transaction succeeded.

Cleanup is deliberately narrow:

- images are replaced with neutral noninteractive blank space sized from the exact clicked image when possible
- video/audio is paused and replaced/removed
- frames, embeds, objects, and links are replaced/removed only when they are the remembered explicit context target
- focus is blurred before removing a focused target so keyboard focus is not intentionally stranded
- target URL must match exactly after ordinary HTTP(S) normalization and the remembered element must still be connected
- detached, expired, mismatched, unsupported, or unmessagable targets fail closed and retain refresh-needed fallback

No DOM snapshot, page text, selector history, clicked-element history, request history, or persistent target record is created. The remembered object lives only in content-script memory and is discarded after use/expiry. No new browser permission was added; the reviewed content script remains limited to the existing HTTP(S), all-frame content-script scope.

On browsers with the native Protection actions badge, cleanup/fallback status uses the action title and does not overwrite the browser-owned count. On older/unsupported action-count implementations, `↻` remains available only when in-place cleanup cannot be completed safely.

## Qualification

These features do not bypass Issue #10. Every implemented feature must be checked in current-head Chromium and Firefox against the exact source fingerprint/package hashes before draft PR #7 is promoted.
