# Subscription configuration safety

All built-in and external filter subscriptions pass through the same `normalizeSubscription()` boundary before they can be persisted, fetched, imported, or used to identify cached policy.

The reviewed string ceilings are:

- subscription id: 96 characters
- subscription title: 120 characters
- raw `sourceUrl` input: 4,096 characters before URL parsing
- canonical HTTPS `sourceUrl`: 4,000 characters after normalization and fragment removal

The raw ceiling prevents an enormous path/query string from becoming URL-parser work. The tighter canonical ceiling leaves room for the list format prefix inside the cache v5 `format + source URL` provenance key. URL normalization can expand Unicode into percent-encoded form, so both raw and canonical representations are checked.

Normal public HTTPS URLs with ports, paths, and query strings remain supported within these limits. Fragments are removed because they are not transmitted in HTTP requests and must not create duplicate source identities.

Query values are part of the user's subscription configuration. They may contain opaque access tokens or signed-feed values supplied by an upstream. Drop Ads does not send those values anywhere except the configured upstream fetch, but exported settings include configured subscription URLs; users should therefore treat a backup containing a sensitive query value as sensitive configuration.

These limits do not add telemetry, a proxy service, or a Drop Ads backend.
