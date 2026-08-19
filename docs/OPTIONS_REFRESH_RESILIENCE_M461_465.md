# Options Settings refresh resilience — numbering reconciliation

This file is retained as a compatibility pointer for the temporary concurrent Options track that initially used M461–465 while another writer was establishing the canonical message/subscription sequence at those numbers.

The Options work is now canonically recorded as **Milestones 468–472** in:

- `docs/MILESTONES_468_472.md`

Historical focused regression filenames with `v461`–`v464` suffixes are intentionally retained to avoid needless file churn. They correspond to canonical M468–471 respectively.

The canonical Options block covers cosmetic committed-render queue recovery, country committed-render/relabel scheduling recovery, country stale mutation-control restoration, and containment of optional cosmetic/country `storage.onChanged` live-sync registration failures. It adds no polling, telemetry, analytics, browsing/request history, identifiers, backend, permission expansion, or retention expansion.

Connector-created or connector-edited regression coverage is repository coverage only and was **not executed** as local, package, Chromium, or Firefox qualification. PR #7 remains draft and Issue #10 remains the authoritative exact-head release gate.
