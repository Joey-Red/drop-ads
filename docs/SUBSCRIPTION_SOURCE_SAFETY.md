# Filter subscription source network boundary

Drop Ads has whole-web host access because browser-local blocking and direct filter-list downloads require it. That permission must not turn an imported or pasted subscription URL into a way to make requests into the user's local network.

Every subscription source already requires HTTPS and rejects URL credentials. It now also passes the same public-host boundary used for remote/shared exact-URL policy. Sources are rejected when their hostname is localhost or a localhost subdomain, `.local`, `home.arpa`, a single-label intranet name, private/loopback/link-local/benchmark/multicast-reserved IPv4, private/link-local/loopback/multicast IPv6, or a private IPv4 address represented through IPv6 mapping/compatibility.

Ordinary public HTTPS hostnames remain supported, including explicit ports, paths, and query-bearing list URLs. Public global IPv4/IPv6 literals also remain valid.

This restriction applies through `normalizeSubscription`, so it covers Settings additions, versioned backup imports, persisted external-subscription normalization, source identity generation, and built-in definitions before any list fetch/cache activation.

This is deliberately different from **personal blocking rules**. A user may intentionally create a local rule for their own LAN target; that rule is enforced inside the browser and remains local. What Drop Ads will not do is fetch remote-list configuration from a local/private network destination.
