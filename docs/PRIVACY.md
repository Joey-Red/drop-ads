# Privacy architecture

Drop Ads is designed not to observe its users.

## Never collected

The extension does not collect or retain browsing history, request history, blocked-request history, matched-element history, page/DOM snapshots, per-site activity history, analytics, identifiers, advertising identifiers, or telemetry. There is no Drop Ads analytics endpoint or custom backend.

Drop Ads also does not maintain a lifetime statistics database. A planned per-tab blocked-request/protection-action indicator is an intentional narrow exception to the older blanket "no counters" wording: it should use the browser's own declarativeNetRequest action count where supported, without giving Drop Ads individual matched-request URLs or building a retained history. No per-request records, timestamps, lifetime totals, or cross-site analytics may be introduced to implement that UI.

## Local functional state

The browser stores only configuration needed to perform blocking: personal network block/allow rules, personal cosmetic hide/exception rules, persistent disabled-site exceptions, per-site cookie exceptions, enabled filter-list subscriptions, cookie mode, normalized cached network/cosmetic list rules, and the next time a cached list is eligible for refresh. Raw downloaded list bodies are not retained. Shared list rules have one persistent representation in the normalized list cache; they are not duplicated into the main settings object.

Cache entries are retained while a subscription remains configured, including when that subscription is temporarily disabled so it can be re-enabled without discarding its last-known-good copy. When a subscription is removed entirely, its normalized cache entry is pruned during the next list refresh/activation transaction; stale IDs left by subscription migration or deduplication are pruned the same way.

A user can also pause protection for a site until the browser session ends. Those user-selected paused domains live only in `storage.session`, which is memory-backed browser-session state; they are not copied into persistent Drop Ads settings. No requests or visited-page history are stored to implement the pause.

The element picker stores only the configured selector/domain scope after explicit confirmation. It does not retain the page's text, HTML, a screenshot, a DOM snapshot, or a history of elements the user hovered/clicked.

## Local policy transactions

User-facing settings that change active network policy are committed through the background runtime rather than writing configuration first and hoping an asynchronous listener catches up. This includes global protection, personal block/allow rules, cookie mode, cookie exceptions, persistent per-site disable/re-enable, session-only pause/resume, and filter-subscription mutations.

For a persistent policy change, Drop Ads constructs the candidate policy, compiles it against the browser's current managed-rule budget, activates the candidate managed DNR rules, and only then persists the candidate state. If DNR activation fails, the old stored state remains untouched. If storage fails after DNR activation, Drop Ads restores the previous managed rules before returning failure.

Session-only pause/resume follows the same order against `storage.session`: candidate DNR policy first, session persistence second, previous managed-rule restoration on persistence failure. The persistent Drop Ads state is not used to store a session pause.

Remote-list refresh, subscription add/enable/disable/remove, persistent/session policy changes, and repair synchronization share one mutation queue. This prevents an alarm-driven refresh from committing an older cache snapshot over a newer user action, and prevents stale refresh work from resurrecting cache for a source that was just removed. Startup/install refresh executes inside the same already-serialized initialization operation rather than recursively queueing itself.

The runtime tracks normalized persistent/session policy fingerprints for the policy represented by active managed DNR. Storage-change repair runs only when current normalized storage differs from those applied-policy fingerprints. This keeps external/legacy writes repairable without making every successful internal transaction rewrite the same DNR a second time.

Desired managed rules are also compared semantically with active managed rules before calling the browser. If they are already equivalent, Drop Ads updates the applied-policy marker without issuing an identical DNR rewrite. Metadata-only list refreshes can therefore persist a newer refresh time without rewriting policy, and policy edits made while global protection is disabled can persist without empty-to-empty browser-rule churn. Current-cache startup/refresh still compares desired policy with browser DNR, so genuinely missing managed rules are repaired.

Cosmetic-only changes are intentionally outside the network DNR fingerprint. They update local cosmetic configuration and trigger bounded content-script policy refresh without causing large network-rule rewrites.

Community auto-submit preference is intentionally different: it does not change network policy, so it remains an ordinary local preference rather than being coupled to DNR activation. `storage.onChanged` synchronization remains as repair coverage for external/legacy state changes; user-facing policy controls no longer depend on that listener as their primary commit mechanism.

## Local settings backup and restore

Settings can be exported to a user-selected JSON file without an account, sync service, or Drop Ads server. The backup format contains only functional persistent configuration: enabled state, community-submission preference, refresh interval, cookie mode/exceptions, personal network block/allow rules, personal cosmetic rules/scopes, persistent disabled-site exceptions, and configured filter subscriptions.

Backups deliberately exclude the normalized filter cache, temporary session pauses, generated external-subscription IDs, dynamic browser rules, request/browsing data, matched-element history, statistics, identifiers, and export timestamps. External subscription entries are reconstructed with fresh local technical IDs during import. Built-in subscription IDs are static project constants, and their source/title/format metadata is restored from the extension's canonical definitions rather than trusted from the backup file.

Import is an explicit local user action. The complete document is normalized and validated before settings are written; malformed or unsupported backup versions are rejected without replacing current settings. After a successful import, the existing list-refresh path may contact enabled external filter URLs contained in the imported configuration.

Subscription URLs and exact filter URLs cannot contain URL userinfo credentials (`user:password@host`). This prevents those credentials from entering persistent settings, normalized caches, or settings backups. HTTPS subscription URLs may still contain ordinary query parameters when a legitimate list service requires them; users should therefore treat query-bearing private feed URLs as configuration secrets when exporting or sharing a settings backup.

## Cookie protection

Cookie protection uses declarative network rules to remove `Cookie` request headers and `Set-Cookie` response headers. The extension does not enumerate, copy, upload, or retain a cookie database. Third-party cookie protection is the default; an explicit hard mode removes cookies from all supported resource types. Per-site exceptions remain local, and a session-only site pause temporarily bypasses cookie protection for that site as part of breakage recovery.

## Planned blocked-request count

Milestone 61 may display a browser-owned per-tab declarativeNetRequest action count in the extension badge. The preferred implementation must not request matched-rule debugging access, inspect each blocked URL, or persist counts into a Drop Ads statistics/history database merely to show the number.

The label must be technically accurate. If a browser's action count includes non-block actions such as header protection, the UI should say something like **Protection actions** rather than falsely claiming every number is an advertisement. If the browser can provide a genuine blocked-request count without exposing individual request metadata, **Blocked requests** is acceptable.

Users should be able to hide the badge without weakening blocking. No lifetime total, per-domain leaderboard, daily history, timestamps, or telemetry may be derived from the count.

## Planned explicit post-block DOM cleanup

Milestone 62 replaces refresh-only feedback when possible. After an explicit **Block ad/resource locally** transaction successfully commits, the content script may immediately hide/neutralize the exact DOM target the user selected.

This transient interaction state must remain local and short-lived. A content script may keep an in-memory element reference or bounded selector for the explicit context-menu target long enough to receive commit success. It must not persist clicked-element history, page text, DOM snapshots, or request history.

Images/media/frames may be collapsed or replaced with a neutral noninteractive placeholder; selected links/text containers may be hidden when safe. Cleanup must happen only after rule commit. A failed transaction leaves the page untouched. The existing `↻` refresh-needed cue remains a fallback when no safe DOM target exists or when an already-executed script/effect cannot be undone.

## Network contacts

The extension contacts only **enabled** filter-list URLs configured in its subscriptions and GitHub pages explicitly opened for eligible user-initiated community submissions. Built-in choices currently include Drop Ads Community and HaGeZi Pro mini (enabled by default), plus StevenBlack Unified Hosts, Block List Project — Ads, and anudeepND Adservers (disabled by default). Disabled optional built-ins are configuration choices only and should not be fetched merely because they are present in Settings.

Before any community GitHub URL is constructed, the candidate is reduced to a domain and passed through the same local/private-network safety boundary used for remote policy. Localhost, private/link-local IPs, `.local`, `home.arpa`, and other remote-unsafe destinations are rejected locally. A deliberate personal LAN/loopback block therefore remains local even when automatic contribution is enabled; no GitHub tab is opened and the local identifier is not placed into a GitHub URL.

Remote list fetches use `credentials: omit`, `referrerPolicy: no-referrer`, and reject redirects instead of silently following a source to another destination. Drop Ads does not append browsing data, user identifiers, block activity, or analytics parameters. The host serving a list will still see ordinary network-level information inherent to receiving an HTTP request, such as the connecting IP address.

Remote response bodies are subject to a fixed byte ceiling while they are streamed. If a response exceeds the limit, the reader is cancelled and the candidate update is rejected rather than buffering an unbounded body into extension memory.

HTTP success is not treated as proof that a response is a filter list. Explicit HTML/XHTML, JSON, and XML media types are rejected, and obvious HTML/XML documents are rejected even when mislabeled as plain or binary data. A parsed remote response must contain at least one supported network rule or supported declarative cosmetic rule. Empty, comment-only, unsupported-only, or document/error responses therefore cannot replace last-known-good policy.

## Remote policy and local-network boundary

Remote lists are not allowed to use downloaded policy to target obvious local/non-public network destinations. The guard applies across supported domain rules, exact URL rules, conservative URL-pattern detection, and shared cosmetic scope, including localhost/local-name targets, single-label intranet hosts, private/link-local IPv4, and IPv6 loopback/unspecified/unique-local/link-local targets. Third-party syntax that violates this boundary is skipped; a native Drop Ads list containing such a rule is rejected.

This does not prevent deliberate personal rules from blocking or cosmetically hiding a LAN or loopback resource. Personal rules are user-controlled local configuration, so supported local IP/domain targets remain valid there. The deterministic `127.0.0.x` qualification fixture relies on that distinction.

Cached shared rules are revalidated against the same remote-policy boundary every time they are merged. That means an unsafe rule left in a cache by an older extension version cannot remain active merely because it predates a stricter parser.

## Planned country/region blocking

Country/region blocking must remain local. The planned first version uses explicit user-selected country-code TLD policy and clearly states that a ccTLD is **not** reliable evidence of the physical country hosting a server. Drop Ads will not send browsing destinations to an IP-geolocation API or custom service to implement this feature.

Personal allow rules remain the recovery path above country policy. Main-frame-only and all-resource modes should be distinct so users can block navigation to a selected ccTLD without necessarily breaking every embedded resource from that suffix.

## Failure behavior

Remote lists are untrusted data. They are bounded, response-validated, parsed into supported rule types, checked against remote-policy safety constraints, and compiled against the browser's rule budget before their normalized cache is accepted. Refresh follows the same DNR-first transaction rule as local policy when effective rules actually change. If DNR activation fails, the previously committed cache remains untouched. If cache persistence fails after DNR activation, Drop Ads restores the previous managed rules.

When candidate policy is semantically identical to active managed DNR, the browser update is skipped. If only cache metadata changed, that metadata can persist without a policy rewrite. If neither cache nor desired DNR changed, refresh performs no cache or DNR write. The no-op optimization never treats cache as proof that browser policy is present: missing/corrupt managed rules are still repaired from current state/cache.

The same fail-closed principle applies to local policy changes: a UI action is not reported as committed merely because configuration bytes were written. Active managed rules and the relevant persistent/session policy must reach the same candidate state, or the operation returns failure and restores the previous active policy as far as the browser storage/DNR APIs permit.
