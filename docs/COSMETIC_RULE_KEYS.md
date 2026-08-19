# Cosmetic rule keys

Personal cosmetic removals use a canonical serialized key with exactly three fields separated by NUL characters:

`selector NUL domains NUL excludedDomains`

The domain fields are comma-separated canonical hostnames. The parser validates the derived maximum key size, exact separator count, domain-list work bounds, selector/domain normalization, and exact round-trip equality before any state read or write used for removal.

Noncanonical aliases are rejected: uppercase or duplicate domains, malformed separators, empty domain elements, invalid selectors, and over-limit keys cannot identify a stored rule. The key-size ceiling is derived from the 512-character selector limit, the 64-domain-per-side limit, and the shared 253-character canonical hostname ceiling.

Keys contain policy configuration only. They do not contain page URLs, DOM content, browsing/request history, timestamps, identifiers, or telemetry.
