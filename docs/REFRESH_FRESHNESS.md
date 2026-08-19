# Filter refresh freshness metadata

Cached policy and cache freshness metadata have different trust roles.

The cached rules themselves are last-known-good policy and are revalidated by the cache codec before activation. `nextRefreshAt` is only an advisory scheduling hint. A damaged timestamp must never make an upstream source look current indefinitely.

User configuration permits update intervals from 1 through 168 hours. Drop Ads therefore accepts future cache deadlines within an eight-day horizon, leaving headroom above the seven-day configured maximum for scheduling and clock skew. A deadline beyond that horizon, a missing/non-finite/negative value, or an invalid current clock value is treated as **refresh due**.

Treating metadata as due does not delete the cached policy. Normal refresh behavior runs: if the source is available, a validated candidate can replace/advance the cache transactionally; if the source is unavailable or rejected, existing last-known-good policy remains active.

This prevents corrupted timestamps and significant clock rollback from suppressing update attempts without weakening offline fallback.
