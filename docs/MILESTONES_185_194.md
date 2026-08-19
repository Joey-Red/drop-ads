# Milestones 185–194 — Boundary hardening and direct-parser work limits

This block continues the privacy-first hardening of Drop Ads without adding permissions, telemetry, request/browsing history, retained statistics, identifiers, remote executable code, or a custom backend.

## 185 — Exact descriptor-safe cache encode boundary

Direct `encodeCacheEntry()` callers now pass through an exact plain-data parsed-policy envelope. `block` and `allow` are required dense enumerable-data arrays, optional cosmetic arrays default only when absent, and all four detached arrays share the existing 300,000 raw-policy-item ceiling before normalization. Source identity, v5 integrity counts, remote-rule safety, and cache semantics remain unchanged.

## 186 — Exact descriptor-safe tab fanout options

`sendTabMessageBatched()` now validates an exact options object before message cloning or browser sends. `batchSize` remains optional, integer-only, and bounded to the existing 1–32 concurrency range. The immutable structured-clone snapshot, tab-id dedupe, and best-effort all-valid-tab fanout behavior are unchanged.

## 187 — Exact descriptor-safe refresh-watchdog options

Refresh-watchdog installation now validates exact `api` / `controller` / optional `logger` data fields before listener or alarm work. Malformed option accessors cannot execute, logger injection must expose `warn()`, and the existing idempotent 30-minute persistent watchdog lifecycle remains unchanged.

## 188 — Exact descriptor-safe Protection-actions options

Protection-actions installation now validates exact `api` / optional `logger` data fields before storage listeners or initial synchronization. Unsupported browser APIs still degrade to a no-op disposable registration after valid configuration parsing. No request observation or retained counting data was added.

## 189 — Exact descriptor-safe context-feedback options

Right-click feedback installation now validates exact API/timing/timer configuration before capability checks, listener registration, or timer scheduling. Existing 1–60,000 ms delay bounds, pending-work cap, committed-only cleanup behavior, browser-owned action-count coexistence, and lifecycle teardown are preserved.

## 190 — Strict subscription boolean scalar boundary

Subscription `enabled` and `builtIn` values are now non-coercive when present. Omitted values retain migration-compatible defaults (`enabled: true`, `builtIn: false`), while type-confused values fail instead of silently changing policy. Built-in source/default behavior and public HTTPS admission are unchanged.

## 191 — Direct cosmetic parser structural work bounds

Direct `parseThirdPartyCosmetics()` calls now inherit the reviewed remote-list structural ceiling before line splitting: at most 300,000 logical lines and 16,384 characters on any line. Cosmetic syntax support, procedural/scriptlet rejection, domain safety, and selector policy are unchanged.

## 192 — Direct network-list parser structural work bounds

The shared network/list parser text boundary now applies the same reviewed 300,000-line / 16,384-character per-line ceiling to direct native, hosts, and conservative third-party parsing, not only to downloaded-list admission. Native syntax, third-party syntax policy, and packaged baseline semantics remain unchanged.

## 193 — Bounded country-TLD raw input before URL parsing

Custom country-TLD input now has a conservative 256-character raw ceiling before URL construction. Canonical country policy still accepts two-letter ccTLDs and valid IDN/punycode labels, and existing navigation/all-resources semantics plus the 10,000-rule inspection bound remain unchanged.

## 194 — Documentation and exact-head qualification gate sync

This document and `ROADMAP.md` synchronize the completed block with Issue #10. The exact branch head is recorded there only as the implementation candidate awaiting clean preflight and real Chromium + Firefox qualification.

## Validation status

Regression files added during Milestones 185–193 are repository coverage only. They were **not executed in this connector-only session**, and no `npm ci`, `npm run check`, packaging, reproducibility, source qualification, qualification-record, Chromium, or Firefox pass is claimed by this block. GitHub-hosted Actions runner allocation also remains externally blocked by the account billing/spending-limit state and is not treated as either a product failure or successful validation.
