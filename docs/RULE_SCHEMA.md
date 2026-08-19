# Canonical rule schemas

Drop Ads treats rule objects as declarative policy, not as extensible activity records. The canonical normalizers therefore accept only exact, plain-object schemas.

## Network rules

A network rule contains exactly:

- `kind`: `domain`, `url`, or `pattern`
- `value`: the rule value
- optional `resourceTypes`: browser resource-type names

No other own fields are accepted. Arrays, class instances, objects with custom prototypes, and objects carrying fields such as `pageText`, `sourcePage`, `requestHistory`, or arbitrary metadata are rejected.

`resourceTypes` is also a bounded inner collection. A single rule may provide at most **16 raw resource-type entries** before dedupe/validation. This is enough to represent the complete reviewed browser resource-type set while preventing a duplicate-heavy inner array from multiplying work inside one otherwise-bounded personal/shared rule collection. One-over input is rejected; it is never truncated. The existing outer live-state limit remains 10,000 personal network rules per personal block/allow collection.

## Cosmetic rules

A cosmetic rule contains exactly:

- `selector`: a bounded declarative CSS selector
- optional `domains`: site scopes
- optional `excludedDomains`: site exceptions

No other own fields are accepted. Page text, HTML, DOM snapshots, click history, source-page metadata, or arbitrary annotations are not part of the rule model.

## Why exact schemas and inner bounds matter

The same normalizers are reused by personal policy, settings backup/restore, persisted-state migration, remote/cache revalidation, country policy, community validation, and runtime mutation paths. Exact schemas prevent one entry path from quietly accepting data that another rejects, and prevent privacy-sensitive fields from being silently stripped in a way that could hide a malformed or future-incompatible configuration.

Inner collection bounds are enforced before dedupe so adversarial duplicate-heavy values cannot turn a small outer rule count into disproportionate normalization work.

Invalid persisted/shared individual rules continue to fail closed where their owning collection intentionally discards corrupt entries. Strict settings imports reject malformed rule objects as a whole rather than silently changing their meaning.

This schema does not add telemetry, browsing/request history, page-content capture, identifiers, or a backend.
