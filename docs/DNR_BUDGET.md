# Managed DNR capacity reserve and namespace

Drop Ads uses browser-managed dynamic rules for shared blocking lists, personal rules, per-site recovery, and cookie protection. Shared lists must not be able to consume every available managed slot and make a later personal allow/block or recovery rule impossible to activate.

When the browser exposes a finite managed-rule capacity, Drop Ads protects a personal-policy reserve before admitting shared policy. The reserve is 10% on very small capacities and is capped at **256 DNR rules** on normal browser capacities. Actual cookie/personal/recovery usage replaces that reserve when it is larger.

Shared community block/allow policy may use only the capacity that remains after this protected personal/recovery space. If a shared candidate does not fit, the candidate transaction fails and the previous last-known-good policy remains active. Drop Ads does **not** silently truncate a remote list to make it fit.

The browser's real total capacity remains authoritative. If user-owned policy itself genuinely exceeds the available managed-rule budget, the mutation fails clearly rather than evicting or weakening higher-precedence personal rules.

Unmanaged rules belonging to other extension behavior are still counted by the runtime before it passes the available Drop Ads budget into the compiler.

## Managed dynamic rule namespace

`npm run dnr-layout-audit` locks the current ID/priority layout before tests/builds:

| Class | IDs | Priority |
| --- | --- | --- |
| shared/community block | 1,000,000–1,499,999 | 100 |
| shared/community allow | 1,500,000–1,999,999 | 200 |
| personal block | 2,000,000–2,499,999 | 300 |
| personal allow / site recovery | 2,500,000–2,999,999 | 400 |
| cookie header policy | 3,000,000 | 50 |

The audit requires positive safe-integer non-overlapping ranges, the cookie ID above all network tiers, the declared managed envelope to span exactly from the first shared tier through the cookie rule, and priority ordering that preserves **personal allow > personal block > shared allow > shared block**. Cookie header policy remains below the network precedence tiers.

Firefox's packaged compatibility static ruleset is audited separately against this dynamic namespace. If a future static rule is added, its ID may not fall inside Drop Ads' managed dynamic ID envelope.
