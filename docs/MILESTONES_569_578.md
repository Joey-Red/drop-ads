# Milestones 569–578 — Guarded browser qualification editing

This block hardens the manual portion of the real Firefox + Chromium qualification workflow without turning repository tooling into browser evidence. Connector-created source, tests, and documentation in this block are repository changes only; they are **not represented as locally executed tests or real browser observations**.

## M569 — Guarded qualification observation editor

Added `tools/qualification-observation-update.mjs` as the sole structured command-line path for recording browser metadata and canonical scenario outcomes. Candidate commit, source fingerprint, package hashes, and package sizes are never accepted as editor arguments and remain bound to the generated qualification record.

## M570 — Strict edit grammar

The editor accepts only `browser` and `scenario` commands, only `chromium`/`firefox`, only the canonical qualification scenario ids, and only `PASS`/`FAIL`/`N/A`/`UNOBSERVED`. Unknown flags, duplicate flags, missing option values, unsafe control characters, and overlong browser/notes text are rejected.

## M571 — Exact-head validation before mutation

Exported the existing current-checkout validator and reused it before every persisted observation edit. The editor first validates the existing schema-v2 observation against the schema-v4 qualification record, then requires a clean checkout whose HEAD and source fingerprint still match that record. Stale or dirty candidates fail before mutation.

## M572 — Explicit overwrite protection

Previously recorded browser versions, scenario statuses, and observation notes cannot be silently changed. Intentional corrections require `--replace`. Resetting an observed status to `UNOBSERVED` is also destructive and therefore requires `--replace`. Idempotent re-entry of an unchanged value remains allowed.

## M573 — Browser-version-first observation semantics

`npm run qualify:mark -- browser <browser> --version <version>` records bounded browser metadata. A scenario cannot move away from `UNOBSERVED` for a browser until that browser has a non-empty recorded version, preserving the existing schema-v2 audit contract.

## M574 — Privacy-minimal bounded notes

Browser and scenario notes remain optional, bounded to the existing schema limits, and reject control/DEL/U+2028/U+2029 characters. Documentation explicitly limits notes to concise product behavior and prohibits personal URLs, request logs, cookies, DOM/page captures, machine/user/path/time/environment data, identifiers, browsing/request history, and statistics.

## M575 — Atomic observation persistence

Added a dedicated atomic writer. Observation updates are serialized as JSON to a unique sibling temporary file using exclusive creation, then renamed over the target only after the complete next observation has passed validation. Failed writes clean up their temporary file and leave the prior artifact as the authoritative record.

## M576 — Protected seed/reset semantics

`qualify:observation` no longer silently destroys a non-identical existing observation artifact. Identical untouched seeds are idempotent. Intentional discard uses the explicit `qualify:observation:replace` command, including recovery from an unreadable prior observation, while still requiring the qualification record to match the current exact clean checkout.

## M577 — Regression contracts and operator workflow

Added focused Node regression coverage for strict parsing, candidate-identity preservation, browser-version-before-status behavior, overwrite guards, exact-head-before-write ordering, atomic persistence, and seed replacement protection. Added `qualify:mark` and explicit reset scripts and updated the qualification runbook/template to use structured commands instead of hand-editing observation JSON.

These connector-created tests have not been represented as executed locally. `npm run check`, packaging/reproducibility/source qualification, and real Firefox/Chromium work remain part of the later exact-head gate.

## M578 — Canonical qualification state synchronization

Synchronized the canonical roadmap and Issue #10 workflow around guarded observation editing. The release gate remains unchanged in meaning: only real browser work against packages bound to the same exact current-head qualification record can replace `UNOBSERVED`; repository tooling cannot manufacture a browser pass.

Any source change after a qualification record or browser observation invalidates that candidate. Run the complete preflight again and create a fresh observation seed rather than carrying statuses forward.

**Next canonical milestone: M579.**
