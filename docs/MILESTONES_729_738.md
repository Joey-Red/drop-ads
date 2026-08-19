# Milestones 729–738 — Settings import and backup hardening

Completed on `main`. This block hardens settings backup/import as a privacy-minimal, provenance-aware, immutable boundary. Repository/connector-created tests and audits are preflight evidence only; they do not replace Issue #10 real-browser qualification.

## Milestone 729 — Exact cache provenance for import preflight

Import activation preflight reuses an existing list cache entry only when that entry decodes successfully and its canonical `sourceKey` exactly matches the normalized current subscription source. Source-less legacy entries and mismatched provenance cannot suppress remote activation accounting.

## Milestone 730 — Immutable activation results

Pending remote-activation results are frozen after validation. Callers cannot mutate the canonical list of sources after the import activation budget has been checked.

## Milestone 731 — Immutable import-message snapshot

Settings-import messages are exact-shape validated as `{type, backupText}` and frozen before asynchronous preflight. Preflight and the delegated runtime listener use the same immutable message snapshot, removing message mutation/TOCTOU ambiguity.

## Milestone 732 — Immutable failure envelopes

Import-preflight failures use a frozen bounded `{ok:false,error}` response envelope. Error text still comes only from the descriptor-safe bounded error-message extractor.

## Milestone 733 — Immutable exported backup graph

`createSettingsBackup()` returns a deeply frozen canonical backup graph. Nested policy arrays, rule records, resource arrays, cosmetic domain arrays, and subscription records are immutable after export validation.

## Milestone 734 — Immutable parsed settings state

`parseSettingsBackup()` returns a deeply frozen canonical settings-state graph, preventing mutation between parse/preflight and activation.

## Milestone 735 — Explicit required v1 fields

Every non-legacy-optional v1 settings field must be present before normalization. Only the two cosmetic arrays remain optional for historical v1 backup compatibility.

## Milestone 736 — Unique subscription identities

Import rejects repeated canonical built-in ids, repeated canonical external source identities, and external subscription records that alias a canonical built-in source. These cases no longer silently deduplicate into altered policy.

## Milestone 737 — Unique canonical policy entries

Settings backup normalization rejects duplicate canonical personal network rules, cosmetic rules, and domains rather than silently collapsing duplicates after normalization.

## Milestone 738 — Executable hardening gate

`tools/settings-import-hardening-audit.mjs` statically protects the M729–M737 invariants and requires the associated regressions. `settings-import-hardening-audit` is part of `npm run check` and therefore `qualify:preflight`.

## Privacy and release status

No telemetry, browsing/request history, DOM/page snapshots, retained statistics, identifiers, or owned backend behavior was added. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate. No browser observations are recorded by this milestone block.
