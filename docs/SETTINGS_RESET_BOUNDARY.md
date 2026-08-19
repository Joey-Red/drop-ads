# Configured settings reset boundary

`Reset configured settings` is an explicit local recovery action. It rebuilds the canonical configured default state and delegates activation to the existing serialized settings-import transaction.

The reset may replace persisted configured policy and its source-bound list cache. That includes global protection defaults, personal network/cosmetic rules, persistent disabled sites, cookie settings/exceptions, filter-list subscriptions, update cadence, and community-contribution preference.

The reset **does not** clear or write `storage.session`. Temporary per-site session pauses remain ephemeral and continue until explicitly resumed or the browser session ends. This separation prevents a configured-settings recovery action from silently changing temporary recovery state.

The reset request contains only its fixed message type. Runtime success/failure responses are bounded and generic; they do not return personal rules, site names, filter-source URLs, browsing/request activity, page content, timestamps, statistics, identifiers, or telemetry. No reset log/history is stored and no new browser permission or Drop Ads backend is introduced.

Because activation delegates to the existing transactional import path, configured policy is validated and activated before persistence, persistence failure rolls managed rules back, list cache reuse remains source-bound, and enabled sources without reusable cache follow the existing import activation behavior. Repository audits/tests remain preflight only; real Chromium and Firefox qualification remains Issue #10.
