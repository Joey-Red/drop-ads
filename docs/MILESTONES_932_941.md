# Milestones 932–941 — Cookie-banner platform boundary and bounded-work hardening

This sequence hardens the local best-effort cookie-banner rejection path without adding telemetry, browsing history, banner history, click history, identifiers, or a Drop Ads backend. Repository tests and audits remain preflight evidence only; real Chromium and Firefox observations belong to Issue #10.

## M932 — Native click capture
The executor captures `HTMLElement`, its prototype, and native `click` through bounded descriptor-only inspection. Accessor-backed or missing primitives fail closed.

## M933 — Bounded action text extraction
Candidate labels no longer materialize whole `innerText`/`textContent` subtrees. Action extraction is capped at 32 text nodes, 512 raw characters, and the existing 160-character normalized action ceiling.

## M934 — Raw consent normalization bound
Each consent attribute/text-node contribution is clamped before whitespace normalization, so the 1,200-character context ceiling is not preceded by unbounded regex work.

## M935 — Shared consent evaluation budget
Each discovery pass owns one transient ancestor-context cache and at most 256 actual consent-context evaluations. Exhaustion fails closed; pre-click revalidation remains current-state and uncached.

## M936 — Executor candidate re-snapshot
The executor re-applies the exact descriptor-safe candidate schema at its public boundary and performs validation/clicking only through the detached frozen snapshot.

## M937 — Style and geometry primitive capture
`getComputedStyle` and `Element.prototype.getBoundingClientRect` are captured through descriptor-safe platform inspection and invoked with explicit receivers.

## M938 — Hit-test and containment primitive capture
Document/shadow `elementFromPoint`, the native `shadowRoot` getter, and `Node.prototype.contains` are captured safely. Open-shadow hit descent remains capped at four levels and closed roots are not pierced.

## M939 — Final pre-click hit test
After consent, text, semantics, and ownership revalidation, the executor performs a second exact hit test immediately before the native click. Covered/moved/hidden controls fail closed.

## M940 — Canonical audit extension
`cookie-banner-hardening-audit` now protects the M932–M939 boundaries and requires all canonical regressions through M939. Older M904/M907/M917 tests were reconciled to the stronger snapshot/captured-platform implementation without weakening their original invariants.

## M941 — Roadmap and qualification synchronization
This document, `ROADMAP.md`, and Issue #10 carry the M932–M941 exact-head qualification delta. The next canonical milestone number is 942. No browser pass is claimed by this documentation work.

## Exact-head browser qualification delta
For both Chromium and Firefox on the exact packaged head, verify that ordinary immediate and delayed/open-shadow rejection still behaves correctly while malformed or unsafe platform boundaries fail closed. Confirm that very large action/consent text cannot cause visibly unbounded work, candidate mutation/accessor tricks do not trigger activation, covered or moved controls are not clicked, and `reject`/`off` behavior plus existing recovery controls remain intact. Confirm again that no banner/page/click/request history or telemetry is retained.
