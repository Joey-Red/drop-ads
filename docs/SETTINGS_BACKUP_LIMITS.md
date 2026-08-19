# Settings backup work limits

A settings backup is user-controlled input. The existing import path rejects serialized UTF-8 payloads larger than 1,000,000 bytes, but byte size alone is not a complete work bound: many tiny array entries can still force normalization, sorting, deduplication, subscription processing, and DNR preflight work.

Drop Ads therefore rejects, rather than truncates, backup collections above these limits:

- personal block rules: 10,000 entries
- personal allow rules: 10,000 entries
- personal cosmetic hide rules: 5,000 entries
- personal cosmetic allow rules: 5,000 entries
- cookie exception domains: 5,000 entries
- disabled-site domains: 5,000 entries
- subscriptions: 128 entries total

The limit is applied to the raw collection **before deduplication**, so a backup containing thousands of duplicate entries cannot use dedupe behavior to evade the work budget. The same limits are enforced when exporting current settings; Drop Ads should not create a backup format instance it would later reject structurally.

These ceilings do not change the normal transactional import contract. Valid imported policy is still fully normalized, required enabled sources are fetched/validated when necessary, candidate DNR is activated before persistence, and failure leaves the previous committed settings/rules in place.
