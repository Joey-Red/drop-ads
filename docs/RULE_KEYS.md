# Canonical network rule keys

Personal network-rule removal uses a serialized key only as a bounded local identifier. It is not a telemetry, request-history, or backend identifier.

## Format

A canonical key is exactly three fields separated by two NUL (`U+0000`) characters:

`kind NUL value NUL resourceTypes`

- `kind` is exactly `domain`, `url`, or `pattern`.
- `value` is the value produced by the core network-rule normalizer and is limited to 16,384 characters.
- `resourceTypes` is empty when the rule has no resource scope. Otherwise it is the canonical sorted, deduplicated comma-separated browser resource-type list.
- Rule values themselves may not contain NUL, so the delimiter is unambiguous.

The maximum accepted serialized-key length is derived from the 16,384-character network-rule ceiling, the longest supported kind, the two separators, and the complete canonical resource-type set. Callers must use the exported `MAX_NETWORK_RULE_KEY_CHARS` rather than inventing a second limit.

## Parsing and removal

`parseRuleKey()` checks the outer key bound before splitting, requires exactly two separators, validates the kind and resource-type list, re-runs the normal network-rule canonicalizers, and then requires exact `ruleKey(parsed) === input` equality. Alternate capitalization, URL fragments that canonicalize away, unsorted or duplicate resource types, extra separators, unsupported values, and over-limit inputs therefore fail instead of aliasing a stored rule.

Personal-rule removal validates the key before scanning or constructing candidate state. A malformed key cannot cause DNR or storage mutation. Conflict helpers also pass generated keys through the same canonical parser so the serialized format remains reversible wherever it is used.

The key contains only the user-defined blocking rule. Drop Ads does not attach timestamps, page context, request history, user/device identifiers, or browsing metadata to it.
