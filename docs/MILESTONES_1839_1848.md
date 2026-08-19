# Milestones 1839–1848 — qualification observation v9 support-contract integrity-v33 hardening

This tranche extends the source-only qualification-support integrity chain without manufacturing Chromium or Firefox observations. Issue #10 remains the sole authoritative real-browser qualification gate.

- **M1839** centralized the exact six-source integrity-v32 privacy authority behind a descriptor-safe frozen path contract with 64 KiB per-source and 384 KiB aggregate ceilings.
- **M1840** hardened the integrity-v32 privacy matcher inventory into an exact frozen descriptor-snapshotted 20-matcher contract with bounded labels/patterns and captured RegExp execution.
- **M1841** routed historical M1836 privacy success through an exact four-field frozen result containing complete ordered `{ path, bytes }` evidence.
- **M1842** locked the integrity-v32 privacy contract to exact 6/20/4 source, matcher, and result cardinalities while preserving the M1836 historical marker.
- **M1843** routed historical M1838 integrity-v32 closeout through an exact four-field frozen result constructor.
- **M1844** locked the integrity-v32 closeout projection to exact four-field/six-source cardinalities while preserving the M1838 historical marker.
- **M1845** composed support-contract integrity v33 from exact M1835 integrity-v32, M1842 privacy-contract, M1844 closeout-contract, and M1838 historical closeout evidence.
- **M1846** added a bounded six-source privacy review over the new integrity-v33 support modules and rejects browser/network/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution surfaces.
- **M1847** bound M1845/M1846 source-only evidence to the repository default test/check path without changing browser qualification semantics.
- **M1848** closes the integrity-v33 support tranche with an exact source-only closeout and roadmap advancement.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, user/device/environment/host identifiers, or profiling.
- No owned Drop Ads backend and no embedded writable GitHub credentials or tokens.
- No new browser permissions and no remote executable code.
- Source-only tests/audits are supporting evidence only and are not represented as executed local CI or browser validation when created through the GitHub connector.
- Issue #10 remains open and authoritative for exact-head Chromium + Firefox observations.
