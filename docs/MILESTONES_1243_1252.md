# Milestones 1243–1252 — Generated-verification qualification/privacy hardening

This tranche hardens **source-only supporting verification** around generated Chromium/Firefox output. It does not create, infer, or persist browser observations. **Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.**

## Canonical sequence

- **M1243 — Qualification-guidance audit.** Added a bounded audit for `docs/GENERATED_VERIFICATION_RESULT_QUALIFICATION.md`; it requires Issue #10 authority, exact-head Chromium/Firefox scope, frozen result/fingerprint guidance, fail-closed mismatch language, and zero-data wording while refusing explicit browser-success claims.
- **M1244 — Privacy-surface audit.** Added a source-only audit over the reviewed generated-verification tool boundary that refuses executable network, extension/browser storage, navigator, DOM/window, and persistence surfaces.
- **M1245 — Bounded audit I/O.** Added one root-confined, regular-file-only, non-symlink, strict-UTF-8 source reader with explicit byte ceilings and opened-handle identity stability checks.
- **M1246 — Shared bounded I/O adoption.** Routed the M1243/M1244 audits through the M1245 reader and removed their duplicate direct filesystem reads.
- **M1247 — Immutable audit inventory.** Centralized the qualification guide, reviewed privacy-source inventory, per-source ceilings, and aggregate ceiling in one frozen contract.
- **M1248 — Shared inventory adoption.** Bound both audits to the immutable M1247 contract so path/limit drift cannot occur through local copies.
- **M1249 — Composite preflight.** Joined hardening, result-contract, qualification-guidance, and privacy-surface checks in `generated-verification-preflight-audit.mjs` while preserving historical marker compatibility.
- **M1250 — Generated-release integration.** Joined the M1243–M1249 audit chain and regressions into the existing generated-release integration gate without replacing any historical generated-verification checks.
- **M1251 — Frozen preflight result contract.** Published the composite preflight result through one exact frozen shape; child marker text is primitive, non-empty, control-free, and bounded to 512 UTF-8 bytes. Historical M1240/M1249 marker fields remain stable.
- **M1252 — Closeout synchronization.** Documents the full tranche, extends exact-head supporting guidance, adds closeout regression coverage, joins the M1251 result-shape guard into generated-release integration, and records the supporting-evidence delta on Issue #10.

## Privacy and evidence invariants

- No telemetry, analytics, request/browsing history, page/DOM snapshots, retained statistics, timestamps, or user/device identifiers are introduced.
- No new Drop Ads backend, network submission path, browser-storage surface, or browser-observation datastore is introduced.
- Source-only audits may prove repository contracts and fail closed on drift; they cannot prove Chromium or Firefox runtime behavior.
- Chromium and Firefox evidence must remain bound to the same exact source head/source fingerprint. Mixed-head evidence is invalid.
- Tests, audits, fixtures, generated records, documentation, and integration markers remain supporting evidence only.

## Exact-head operator boundary

Run the normal repository preflight/package/release-verification workflow, then perform real Chromium and Firefox observations against the exact packages and source fingerprint recorded for qualification. If source HEAD or package identity changes, discard prior browser observations for that qualification attempt. Record browser-specific differences on Issue #10 before treating the release gate as complete.
