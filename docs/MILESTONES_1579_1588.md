# Milestones 1579–1588 — Qualification observation v9 support-contract integrity-v7 hardening

This tranche continues source-only qualification-support hardening. It does not create, infer, or substitute Chromium/Firefox runtime observations; Issue #10 remains the sole exact-head browser qualification authority.

## M1579 — Centralize integrity-v6 privacy source contract

Moved the six M1576 privacy-reviewed support modules and their 64 KiB per-source / 384 KiB aggregate ceilings into one immutable descriptor-safe source contract, then bound the historical privacy audit to that authority.

## M1580 — Descriptor-snapshot integrity-v6 privacy matchers

Converted the forbidden-surface inventory into a frozen 20-matcher contract with captured Object/Reflect/Array/Set/RegExp/Number/Buffer primitives, exact tuple admission, duplicate-label refusal, stateless Unicode-only regular expressions, and bounded labels/pattern sources.

## M1581 — Exact integrity-v6 privacy evidence result

Added a descriptor-safe exact four-field result constructor. Privacy success now requires all six canonical `{ path, bytes }` evidence entries in order and recomputes reviewed-source and aggregate-byte summaries under the M1579 limits.

## M1582 — Exact integrity-v6 privacy contract audit

Added a dedicated audit locking the six-source contract, 64 KiB / 384 KiB ceilings, 20 matcher cardinality, exact `files, reviewedSources, aggregateBytes, marker` result projection, and historical M1576 marker.

## M1583 — Exact integrity-v6 closeout result

Added a frozen four-field constructor for the historical M1578 closeout result and routed closeout publication through it without widening the result surface.

## M1584 — Exact integrity-v6 closeout contract audit

Added a dedicated audit locking the M1583 closeout projection, six-source privacy cardinality, and historical M1578 closeout marker.

## M1585 — Support-contract integrity v7 composition

Composed M1575 integrity-v6 evidence, M1582 privacy-contract evidence, M1584 closeout-contract evidence, and the M1578 closeout marker through descriptor-read child results into one frozen M1585 integration result.

## M1586 — Bounded integrity-v7 support privacy review

Added a six-source, 64 KiB/source, 384 KiB aggregate source-only review over the new M1579–M1585 support modules. It rejects browser/network/storage APIs, environment or host-identity discovery, timing collection, subprocess/worker creation, and dynamic execution.

## M1587 — Default test-gate binding

Added a regression that composes M1585 integrity-v7 and M1586 privacy evidence and locks that the normal `npm run check` path still reaches repository-wide `npm test`, whose test command covers `tests/*.test.js`.

## M1588 — Source-only closeout

Added a dedicated closeout composing M1585 and M1586 evidence, documented this tranche, advanced the canonical ROADMAP number, and posted the source-only delta to Issue #10 without claiming browser execution.

## Preserved invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, or user/device identifiers.
- No environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior.
- Remote executable code remains forbidden; remote lists remain hostile bounded declarative data.
- Firefox and Chromium runtime qualification requires real observations on the exact packaged head recorded through Issue #10.
- Connector-created tests/audits in this tranche are source changes only and are not represented as locally or browser-executed validation.
