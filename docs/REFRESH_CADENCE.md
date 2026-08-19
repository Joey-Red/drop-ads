# Filter refresh cadence and recovery

Drop Ads keeps the user-configured normal filter freshness interval (12 hours by default) and a separate **30-minute due-source recovery watchdog**.

The normal alarm remains the primary refresh cadence. The watchdog does not force downloads: it calls the same serialized `refreshListsOnce(false)` path, so each source first evaluates its existing last-known-good freshness metadata.

- A current source causes only local state/cache due checks and no network fetch.
- A due source that refreshes successfully receives its normal future `nextRefreshAt`, so later watchdog ticks skip its network request.
- A due source that fails keeps its prior last-known-good cache and remains due. The next 30-minute watchdog tick can therefore retry it without weakening active policy.
- Repeated failures remain bounded to the watchdog cadence; there is no busy loop or rapid retry timer.
- Manual **Refresh lists** remains an explicit one-shot forced action and does not create a hidden persistent failure/history record.

The watchdog uses its own named browser alarm and checks for an existing alarm before creating one, so ordinary Manifest V3 service-worker recreation does not continuously reset the countdown. Watchdog initialization or refresh failure is isolated as an optional recovery feature and cannot make the mandatory blocker fail registration/startup.

No source failure history, request history, telemetry, identifiers, or backend is introduced by this mechanism.
