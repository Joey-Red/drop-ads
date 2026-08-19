# Milestones 154–163 — Session, backup, and nested policy-array hardening

This block continues Drop Ads' browser-local privacy and reliability hardening. It does not add telemetry, browsing/request history, retained page/DOM history, identifiers, a statistics database, new permissions, or a Drop Ads backend.

## 154 — descriptor-safe session storage envelopes

- `storage.session.get()` results are exact plain-data envelopes before the session value is observed
- inherited/accessor/symbol/unknown fields fail without getter execution
- missing session state and browsers without session storage retain the existing safe defaults

## 155 — descriptor-safe session disabled-site arrays

- session `disabledSites` is a dense enumerable data array before domain normalization
- the existing 5,000-entry raw ceiling remains in force
- holes, accessors, symbols, and extra array fields fail before normalization or persistence

## 156 — descriptor-safe settings-backup object schemas

- backup root/settings/subscription records use the shared exact plain-data object boundary
- subscription shape is preflighted before built-in-vs-external discrimination
- malformed getters/prototypes/symbols/unknown fields cannot become imported configuration

## 157 — descriptor-safe settings-backup collections

- network, cosmetic, domain, and subscription backup arrays use detached dense snapshots
- existing 10,000 / 5,000 / 5,000 / 128 raw ceilings remain unchanged
- omitted v1 cosmetic arrays remain backward compatible

## 158 — non-coercive backup update intervals

- `updateIntervalHours` is accepted only as a finite number from 1 through 168
- numeric strings and coercion objects are rejected without conversion-hook execution

## 159 — strict canonical backup export scalars

- backup export requires every canonical live settings field
- `enabled` and `autoSubmitCommunity` must be real booleans rather than truthy/falsy values
- malformed scalar state fails before collection/subscription export work

## 160 — cheap serialized-backup size preflight

- obviously oversized strings are rejected by character length before UTF-8 allocation or JSON parsing
- the existing 1,000,000-byte UTF-8 ceiling still catches multibyte payloads within the character preflight

## 161 — descriptor-safe network `resourceTypes`

- nested `resourceTypes` arrays are dense data arrays with the existing 16-entry raw ceiling
- holes/accessors/symbols/extra fields fail before dedupe and supported-type validation
- valid values retain canonical sorted unique output

## 162 — descriptor-safe cosmetic scope arrays

- nested `domains` and `excludedDomains` arrays are dense data arrays with the existing 64-entry raw ceiling
- valid domain scopes retain canonical normalization, dedupe, sorting, and rule-key round trips

## 163 — bounded descriptor-safe cosmetic collections

- generic cosmetic-rule collections are dense data arrays before candidate iteration
- one collection is capped at 300,000 raw candidates, matching the reviewed remote-policy work scale
- invalid candidate rules are still discarded after the collection itself passes its work/descriptor boundary

## Release status

Repository coverage added by these milestones is preflight only. Issue #10 remains the real Chromium + Firefox exact-head qualification gate, and PR #7 remains draft until that browser matrix is observed on one frozen commit/package fingerprint.
