# Milestones 1889–1898 — Qualification observation v9 support-contract integrity-v38 hardening

This tranche recursively hardens source-only qualification-support evidence. It does **not** manufacture Chromium or Firefox runtime observations; Issue #10 remains the sole browser qualification authority for the exact packaged head.

## M1889 — Centralized integrity-v37 privacy source authority

The historical M1886 privacy review now consumes one immutable descriptor-safe six-source path contract with a 64 KiB per-source ceiling and 384 KiB aggregate ceiling. Mutable, reordered, accessor-backed, or widened inventories fail closed.

## M1890 — Descriptor-safe privacy matcher inventory

The integrity-v37 privacy review now snapshots an exact frozen 20-matcher inventory using captured Object/Reflect/Array/Set/RegExp/Number/Buffer primitives. Matcher labels and pattern text are bounded, duplicate labels are rejected, and stateful global/sticky regexes are forbidden.

## M1891 — Exact privacy evidence publication

M1886 privacy success now publishes through an exact four-field frozen result containing ordered `{ path, bytes }` evidence for all six sources, the reviewed-source count, recomputed aggregate bytes, and the unchanged historical privacy marker.

## M1892 — Exact privacy contract audit

The integrity-v37 privacy contract audit binds the six canonical sources, 64 KiB/384 KiB ceilings, 20 matchers, four privacy-result fields, and the unchanged M1886 privacy marker. Its new source-only marker is M1892.

## M1893 — Exact historical closeout result

The M1888 integrity-v37 closeout now publishes through an exact four-field frozen constructor requiring the integrity marker, privacy marker, six reviewed privacy sources, and unchanged historical closeout marker.

## M1894 — Exact closeout contract audit

The integrity-v37 closeout contract audit locks the exact four-key closeout projection, six-source privacy cardinality, and historical M1888 closeout marker. Its new source-only marker is M1894.

## M1895 — Support-contract integrity v38 composition

Integrity v38 composes the exact M1885 integrity-v37 marker, M1892 privacy contract evidence (6/20/4), M1894 closeout contract evidence (4/6), and historical M1888 closeout marker into one frozen result.

## M1896 — Bounded integrity-v38 privacy review

A new source-only privacy audit reviews exactly six support modules introduced by M1889–M1895: the integrity-v37 privacy contract/result/contract-audit, integrity-v37 closeout result/contract-audit, and integrity-v38 integration audit. Work remains bounded to 64 KiB per source and 384 KiB aggregate, with browser/network/storage, environment/host identity, timing, subprocess/worker, and dynamic-execution surfaces rejected.

## M1897 — Default test-gate binding

A regression binds the M1895 integrity-v38 integration evidence and M1896 six-source privacy evidence to the repository-wide default test path, while requiring `npm test` to remain `node --test tests/*.test.js` and `npm run check` to continue invoking the test suite.

## M1898 — Source-only closeout

The integrity-v38 closeout composes exact M1895 and M1896 evidence, preserves the six-source privacy cardinality, advances the canonical roadmap to M1899, and records this tranche as supporting evidence for Issue #10.

## Privacy and qualification invariants

- Issue #10 remains the sole browser qualification authority for real Firefox + Chromium observations on the exact packaged head.
- Connector-created tests and audits are not represented as actually executed locally, in GitHub Actions, or in browsers.
- Qualification support retains zero telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics/counts, timestamps, user/device/environment identifiers, or host profiling.
- No embedded writable GitHub credentials/tokens, owned Drop Ads backend, remote executable code, or new extension permissions are introduced by this tranche.
- GitHub-hosted Actions availability/billing state is external to this source-only evidence and is neither a product failure nor a successful browser qualification.
