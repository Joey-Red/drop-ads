# Filter-list formats

Remote filter lists are data only. The extension never downloads or executes JavaScript, WebAssembly, or other remote code.

## Native format: `drop-ads-v1`

One network rule per line:

```text
block domain ads.example.com
allow domain required.example.com
block url https://example.com/path/ad.js
allow url https://example.com/path/required.js
block pattern ||tracker.example/path/*
```

Blank lines and lines beginning with `#` or `!` are comments. Native lists are strict: an unknown or malformed non-comment line rejects the list instead of being guessed at.

## Third-party imports

The compatibility importer accepts a conservative subset useful for bootstrapping from common lists:

- bare domains
- hosts-file entries such as `0.0.0.0 ads.example.com`
- Adblock-style domain anchors such as `||ads.example.com^`
- Adblock-style network exceptions such as `@@||required.example.com^`
- DNR-compatible URL-filter patterns without modifiers
- anchored exact HTTP(S) URLs
- basic declarative cosmetic hides such as `example.com##.sponsor`
- basic declarative cosmetic exceptions such as `example.com#@#.needed`

Procedural/extended cosmetic syntax, scriptlets, regex network rules, and network rules with unsupported `$` modifiers are skipped rather than weakened or broadened. Remote executable code is never accepted.

## Remote-list trust boundary

Community and external lists are untrusted policy. They cannot target obvious local/non-public network destinations by switching rule syntax. The safety check applies to supported remote domain, exact-URL, and URL-pattern rules and rejects localhost/local-name targets, single-label intranet hosts such as `intranet`, private/link-local IPv4, IPv6 loopback/unspecified/unique-local/link-local targets, and other explicitly non-public address classes handled by the parser.

Single-label rejection also applies when the target is hidden inside an exact URL or obvious domain/absolute-URL pattern, including forms such as `https://intranet/...`, `||intranet^`, and `||intranet:8443^`. Third-party entries that violate the boundary are skipped; a strict native list containing one is rejected rather than partially activated.

This restriction does **not** prevent a user from creating a personal local rule where the personal-rule grammar supports that target. Personal IP and exact-URL rules can deliberately target LAN or loopback resources, which is also how the deterministic `127.0.0.x` qualification fixture is exercised. The boundary is between user-controlled local policy and downloaded shared policy.

Exact HTTP(S) rules cannot contain URL credentials such as `https://user:password@example.com/...`; those values are rejected before they can enter settings or cache. The same rule applies to filter subscription URLs. HTTPS subscription URLs may still contain ordinary query parameters when a legitimate feed requires them.

## Native metadata

The packaged native baseline metadata is a strict schema-version-1 plain object containing exactly:

```json
{
  "schemaVersion": 1,
  "id": "drop-ads-default",
  "title": "Drop Ads Default",
  "format": "drop-ads-v1"
}
```

No unknown fields are accepted. In particular, source URLs, page URLs, activity metadata, analytics fields, or other arbitrary annotations are not part of native list metadata. External list source configuration belongs to the separately validated subscription model.

Native metadata IDs are limited to **96 characters** using the reviewed subscription-style identifier character set. Titles are limited to **120 characters** and trimmed after validation. The format must be exactly `drop-ads-v1`; `hosts` and `third-party` are subscription parser choices, not packaged native-metadata formats.

The bundled first-install `default.meta.json` passes through this same validator before its list body can seed the last-known-good cache.

## Rule limits

External/community rules are dynamic rules. The active rule compiler checks the browser's own dynamic-rule capacity before attempting an update and preserves a user/recovery reserve before shared-list admission. Lists are never silently truncated to fit a browser budget.
