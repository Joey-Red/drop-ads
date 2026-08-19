# Milestones 799–808 — Settings form ergonomics and input recovery

This canonical block hardens Settings form feedback and correction paths without changing blocking precedence, source admission, or privacy invariants. Repository/connector-created tests and audits are preflight coverage only; they were not executed locally or in real browsers here.

## M799 — Synchronize native Settings validity state

`src/options/form-state-semantics.js` centralizes form feedback and derives constrained-control invalidity from native constraint validation rather than treating operational/runtime error text as proof that a valid value is invalid. `aria-errormessage` is exposed only when the affected native control is invalid and its live error contains text.

## M800 — Keep cosmetic validity semantics native and correction-safe

Cosmetic hide/allow selector inputs follow the same native validity boundary. Optional site-scope fields are not falsely marked invalid merely because an operation reports an error, while the canonical parser remains authoritative for submitted rule semantics.

## M801 — Clear personal policy errors as users correct input

Editing personal block, personal allow, or cookie-exception input clears stale validation/transaction feedback before the next retry. Listener ownership stays local to Settings and is torn down on `pagehide`; typed values and edit history are not retained.

## M802 — Consolidate Settings form-state semantics

`src/options/form-state-semantics.js` is the single shipped behavior owner for Settings form-state semantics. It owns native error publication, semantic backup-file error mapping, stale-error clearing, Country/TLD source state, and cosmetic scope support. The duplicate `form-ergonomics.js` behavior path was removed, and regression coverage prevents it from returning.

## M803 — Clear stale external-list errors on edit

Editing the external-list URL or changing its declared format clears stale `subscription-error` text before a new validation/activation attempt. The URL remains the native constraint-validation control; transactional list activation and source admission remain unchanged.

## M804 — Make Country/TLD source choice and readiness explicit

Country/TLD preset and custom entry are mutually exclusive in local UI state. Choosing a preset clears custom text, typing a custom TLD clears the preset, and submit remains unavailable until a source exists without fighting the Country form's own `aria-busy` lifecycle. Canonical normalization remains authoritative.

## M805 — Preview cosmetic scope without echoing input

Cosmetic hide/allow forms expose only generic `Scope: all sites` versus `Scope: one site` previews. Typed site text is never echoed, logged, persisted, or retained by the preview; final validation remains deferred to the existing rule parser.

## M806 — Associate cosmetic actions with live scope previews

Each cosmetic form's site input, selector input, and submit action append the generic live scope preview to their existing `aria-describedby` relationships. Existing policy guidance and transaction-error associations are preserved rather than replaced.

## M807 — Enforce Settings form ergonomics

`settings-form-ergonomics-audit` is part of `npm run check`. It enforces canonical form-state ownership, native versus semantic error boundaries, stale-error clearing, Country/TLD readiness, generic non-echoing cosmetic scope previews, scope-description relationships, lifecycle teardown, and the required M799–M806 regressions.

## M808 — Synchronize milestone and release-gate state

`ROADMAP.md` advances the next canonical milestone to M809, current preflight documentation includes `settings-form-ergonomics-audit`, and Issue #10 remains open as the authoritative exact-head Chromium + Firefox real-browser qualification gate. Repository preflight coverage does not substitute for real browser observations.

## Evidence boundary

All changes in this continuation were made through the GitHub connector. The added tests and audits were **not executed locally**, `npm run check` was **not executed**, and no Chromium/Firefox browser observations were recorded. Issue #10 remains the authoritative exact-head real-browser gate.
