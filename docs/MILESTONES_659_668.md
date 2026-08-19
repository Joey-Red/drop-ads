# Milestones 659–668 — Deterministic source qualification hardening

Completed repository hardening block. These changes are preflight tooling and source-report integrity work; they are **not** real Chromium or Firefox qualification evidence.

## M659 — Built-in source catalog snapshot

`qualify:sources` now snapshots the imported built-in subscription catalog as a bounded standard dense array before normalization/selection. Holes, accessors, extra array fields, custom prototypes, and oversized catalogs fail closed.

## M660 — Catalog identity ambiguity rejection

Normalized qualification catalogs must have unique source ids and unique normalized source identities. Duplicate ids or multiple ids targeting the same canonical source fail before network work.

## M661 — Locale-independent ordering

Source selection, summary rows, failure rows, and report ascending-id validation use one fixed code-unit comparator rather than `localeCompare()`. Qualification ordering no longer varies with runtime locale.

## M662 — Selected-source outcome coverage

Every selected source must appear exactly once in the final report as either a successful source row or a fixed-code failure row. Missing, extra, or wrong-identity outcomes are rejected.

## M663 — Duplicate canonical rule rejection

Successful source summaries reject duplicate canonical rules within each network/cosmetic action class before cross-source overlap accounting. A duplicate inside one source can no longer masquerade as overlap with an earlier source.

## M664 — Immutable summary outputs

Exported source summaries are immutable snapshots. Source rows, network/cosmetic count sections, the source array, totals, and summary envelope are frozen before return.

## M665 — Successful-result identity uniqueness

Successful result snapshots require unique normalized subscription ids and unique normalized source identities before sorting or aggregation.

## M666 — Canonical report metadata

Successful report titles must already be canonical trimmed text, and report formats are restricted to the supported subscription formats: `drop-ads-v1`, `third-party`, and `hosts`.

## M667 — Combined outcome ceiling

The report source ceiling applies to successful and failed outcomes **combined**, preventing two individually bounded arrays from producing an oversized split report.

## M668 — Audit and qualification-state synchronization

`source-qualification-hardening-audit` now protects the M659–M667 catalog, ordering, coverage, duplicate-rule, immutability, metadata, and combined-outcome boundaries. Current qualification docs and the canonical roadmap are synchronized with this block.

## Evidence boundary

The repository changes, tests, and audits in M659–M668 were created through the GitHub connector in this continuation and were not executed locally or in real browsers here. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate. No browser or release qualification is claimed.

The product privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, matched-element history, retained blocked-request statistics, user/device identifiers, or owned Drop Ads backend.
