# Runtime state storage safety

Drop Ads treats browser extension storage as untrusted persisted configuration at startup because legacy versions, manual extension debugging, browser restore behavior, or other tooling can leave malformed values behind.

## Persistent local state

Before any `storage.local` state collection is normalized or deduplicated, raw array lengths are checked against fixed live-state ceilings: 10,000 personal network rules per list, 5,000 personal cosmetic rules per list, 5,000 disabled/cookie-exception domains per list, and 128 subscriptions. Duplicate-heavy input does not get extra work simply because it would later deduplicate.

Oversized state is rejected as invalid configuration. Drop Ads does not truncate it, partially persist it, or silently reinterpret only a prefix. Candidate writes are checked before `storage.local.set`, so a rejected mutation leaves the previously committed state untouched. The same limits are intentionally aligned with the settings-backup structural limits.

## Session-only pause state

`storage.session` is ephemeral, but it is still browser-managed persisted input while the current browser session is alive. The raw `disabledSites` array is therefore bounded to the same 5,000-domain ceiling **before** normalization or deduplication. A duplicate-heavy one-over array is rejected rather than compressed after unbounded work.

Malformed non-array session values loaded from older/corrupt state can safely fall back to the empty session default because that decision requires no collection traversal. Explicit saves are stricter: malformed or oversized candidate session state is rejected before `storage.session.set`. The existing transactional session-policy path therefore retains the previously committed managed DNR and session state when a candidate cannot be admitted.

## Filter cache entry and byte budgets

The raw compact last-known-good cache object is limited to **256 own entries** before `normalizeListCache()` iterates or decodes any entry. This intentionally leaves headroom above the maximum 128 configured subscriptions while preventing externally modified storage from creating thousands of tiny cache keys just to consume startup work. A one-over object is rejected as a whole; keys are never truncated.

After that raw work bound and normal cache pruning/normalization, the compact cache has a separate **8,000,000-byte UTF-8 JSON ceiling**. The byte ceiling is intentionally below the common browser `storage.local` budget so user configuration and browser storage overhead retain headroom without requesting `unlimitedStorage`.

The byte bound is checked before cache persistence and before an effective shared policy is activated from a candidate cache. A cache that does not fit is rejected as a whole; Drop Ads does not silently truncate active source policy or evict an enabled source to make it fit. The previous committed DNR and last-known-good cache therefore remain the transaction fallback.

The raw entry-count ceiling, persisted byte ceiling, and per-download 5,000,000-byte hostile-input limit protect different boundaries: cache normalization work, local persistence reliability, and individual remote-response admission respectively.

These are work/memory/storage safety boundaries; they do not add telemetry, browsing/request history, or any external recovery service.
