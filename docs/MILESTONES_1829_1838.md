# Milestones 1829–1838 — Qualification observation v9 support-contract integrity-v32 hardening

This tranche recursively hardens the source-only support evidence around the real browser qualification gate. It does not manufacture Firefox or Chromium observations; Issue #10 remains the sole authority for exact-head runtime qualification.

- **M1829:** centralized the exact six-source integrity-v31 privacy authority with descriptor-safe frozen path admission and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1830:** hardened the canonical 20 privacy matchers with captured intrinsics, descriptor-safe tuple admission, stateless Unicode regex requirements, uniqueness checks, and bounded label/pattern bytes.
- **M1831:** required integrity-v31 privacy success to publish through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence.
- **M1832:** locked the integrity-v31 privacy contract to six sources, 20 matchers, four result fields, exact byte ceilings, and the historical M1826 marker.
- **M1833:** routed the historical M1828 integrity-v31 closeout through an exact frozen four-field result constructor.
- **M1834:** locked the integrity-v31 closeout contract to four exact result fields, six reviewed privacy sources, and the historical M1828 marker.
- **M1835:** composed support-contract integrity v32 from exact integrity-v31 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M1836:** bounded a six-source privacy review over the newly introduced v32 support modules and rejected network/browser/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution surfaces.
- **M1837:** bound the integrity-v32 integration and privacy evidence to the repository's normal `npm run check` → `npm run test` gate.
- **M1838:** added the dedicated source-only integrity-v32 closeout and advanced canonical work to M1839.

The tranche adds no telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics, timestamps, identifiers, user/device/environment profiling, embedded writable credentials, owned backend behavior, new extension permissions, or remote executable code. Connector-created tests and audits are repository changes only and are not represented as locally executed CI or browser observations.
