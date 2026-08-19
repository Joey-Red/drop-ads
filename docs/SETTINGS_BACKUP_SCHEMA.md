# Settings backup schema discipline

Drop Ads settings backups are explicitly versioned (`format: drop-ads-settings`, version `1`). A version is a data contract, not a hint.

Version 1 accepts only its declared own fields at four boundaries:

- backup root: `format`, `version`, `settings`
- settings: the documented protection, cookie, personal network/cosmetic, disabled-site, and subscription fields
- built-in subscription record: `id`, `enabled`
- external subscription record: `title`, `format`, `sourceUrl`, `enabled`

Unknown own properties are rejected rather than ignored. This includes typoed fields and prototype-pollution-style keys such as `__proto__` or `constructor`. Silently ignoring an unknown field is dangerous for backups because the user may believe a setting was restored when Drop Ads actually discarded it.

Subscription `enabled` is optional for compatibility with older v1 objects, but when present it must be a JSON boolean. Built-in ids must still map to canonical built-ins; external source validation remains unchanged.

The two personal cosmetic arrays may be absent because early v1 backups predate cosmetic configuration. They normalize to empty arrays. Their absence is a narrow documented migration exception, not permission for arbitrary future fields.

Future settings fields that need to survive export/import require an intentional schema/version migration decision and tests. This keeps backup evolution explicit and prevents private/debug fields from accidentally becoming accepted persistence data.
