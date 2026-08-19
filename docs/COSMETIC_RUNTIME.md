# Cosmetic runtime memory model

Cosmetic policy is evaluated locally in extension/content-script contexts. To avoid repeatedly decoding the entire filter cache for every frame, the background cosmetic runtime keeps one **in-memory normalized input snapshot** containing only current Drop Ads configuration state, session pause state, and the normalized list cache.

The snapshot does **not** contain page hostnames, tab IDs, page text, DOM data, matched elements, request history, or per-site policy results. A hostname is evaluated against the shared input snapshot only for the duration of that request.

Concurrent/repeated frame requests share one input-load Promise while configuration is unchanged. Relevant `storage.local` state/cache changes and `storage.session` pause changes invalidate the snapshot before live cosmetic refresh fanout. Explicit cosmetic add/remove mutations also invalidate it immediately after persistence so callers do not depend solely on storage-event timing.

Unrelated extension-storage changes do not invalidate cosmetic inputs. A failed input load removes the rejected snapshot so a later request retries normally rather than becoming permanently poisoned.

## Live refresh fanout

When cosmetic inputs change, Drop Ads enumerates the browser's current tabs and sends the existing `drop-ads:cosmetic-refresh` control message. Valid integer tab IDs are deduplicated and processed in deterministic batches of at most **32 concurrent sends**. The total number of tabs is not capped; batching bounds burst concurrency rather than skipping refreshes.

A restricted/closed tab rejection is isolated with `Promise.allSettled`, so later tabs and later batches still receive refresh requests. The helper exposes only ephemeral aggregate attempted/failed counts to tests/callers; these values are not persisted or accumulated as user statistics. Tab URLs, titles, hostnames, and message results are not retained.

This is a performance/runtime mechanism, not activity storage. It disappears with the service-worker/background context and adds no telemetry, history, identifiers, or backend.
