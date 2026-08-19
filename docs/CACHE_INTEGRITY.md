# Cached policy integrity and provenance

Filter-list cache is a last-known-good policy store, not an unvalidated persistence shortcut. Every cached rule is re-normalized through the current remote-network and cosmetic safety validators before it can become active.

Cache format v5 retains the deterministic integrity counts introduced in v4 for four policy classes: network block, network allow, cosmetic hide, and cosmetic allow. On read, Drop Ads decodes/revalidates the packed policy and requires the resulting counts to equal the recorded counts. Missing packed values, malformed tuples, newly unsafe rules, tampered counts, negative/fractional counts, or an all-zero policy invalidate the entire entry.

## Decode work bounds

Before a compact or legacy cache entry iterates any stored policy item, Drop Ads sums the raw array lengths for network block/allow domain, URL, pattern, and resource-scoped packs plus cosmetic hide/allow packs. One cache entry may contain at most **300,000 raw policy items**, matching the hostile remote supported-rule admission ceiling. A one-over entry is discarded as a whole; it is never truncated to the first 300,000 items.

This per-entry work ceiling layers with the storage boundaries documented in `STATE_STORAGE.md`: at most 256 raw cache keys are admitted before cache normalization, and the normalized compact cache must fit the 8,000,000-byte persisted JSON budget. The three checks protect different stages—entry count, per-entry decode work, and serialized persistence size.

## Source provenance

Version 5 can also carry `s`, the canonical filter-source identity formed from the normalized list format plus normalized HTTPS source URL. Policy returned by production remote downloads is stamped with this identity before it is cached.

When a v5 entry is bound, Drop Ads compares that source identity with the currently configured subscription before pruning or merging the cache. A mismatch contributes **no network or cosmetic policy** and the stale entry is pruned. Reusing a subscription id for another URL/format therefore cannot make the prior source's cache masquerade as the replacement source.

Drop Ads does not invent provenance during migration. v4/v3/v2/legacy cache and the packaged first-install community seed are represented as **unbound** v5 entries. Unbound policy remains eligible as offline last-known-good fallback, but its freshness is treated as due (`nextRefreshAt` effectively 0) so normal refresh immediately attempts to replace it with a source-bound copy. If the upstream is unavailable, the unbound LKG remains active rather than being destroyed.

This distinction gives migration a safe direction: preserve known-good offline protection, aggressively seek validated provenance, and never relabel old bytes as though their source identity had been recorded historically.

No request history, browsing history, telemetry, identifiers, or per-user statistics are stored in integrity/provenance metadata.
