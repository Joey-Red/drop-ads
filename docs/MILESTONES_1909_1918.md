# Milestones 1909–1918 — Qualification observation v9 support-contract integrity-v40 hardening

This tranche continues source-only qualification-support hardening. It does **not** create or substitute real Chromium or Firefox observations; Issue #10 remains the sole browser qualification authority.

- **M1909** centralized the exact six-source integrity-v39 privacy authority with immutable descriptor-safe source ordering and 64 KiB/source, 384 KiB aggregate ceilings.
- **M1910** replaced ad-hoc privacy matchers with a descriptor-safe frozen 20-matcher inventory and captured RegExp/Object/Reflect/Array/Set/Number/Buffer primitives.
- **M1911** required exact ordered six-source `{ path, bytes }` evidence and an exact four-field privacy result.
- **M1912** added the exact integrity-v39 privacy audit contract, locking 6 sources, 20 matchers, four result fields, and the historical M1906 marker.
- **M1913** routed the historical M1908 integrity-v39 closeout through an exact four-field constructor.
- **M1914** added the exact integrity-v39 closeout contract audit, locking four result fields and six reviewed privacy sources.
- **M1915** composed support-contract integrity v40 from exact integrity-v39 integration/privacy/closeout evidence.
- **M1916** bounded the six newly introduced support modules with the canonical source-only privacy review and exact M1916 marker.
- **M1917** bound M1915/M1916 evidence to the repository-wide default test/check path.
- **M1918** closes the source-only integrity-v40 tranche and advances canonical planning without manufacturing browser evidence.

## Retained invariants

Drop Ads continues to retain zero telemetry, analytics, browsing/request history, page/DOM snapshots, retained blocked-request or contribution statistics, timestamps, identifiers, or user/device/environment/host profiling. No writable embedded GitHub credential, owned Drop Ads backend, new extension permission, remote executable code, or procedural remote scriptlet surface was introduced.

Repository tests, audits, fixtures, deterministic builds/packages, generated records, and source-only markers remain preflight/supporting evidence only. Real browser observations must be recorded against the exact packaged head through Issue #10.
