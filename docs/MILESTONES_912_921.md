# Milestones 912–921 — Cookie-banner action safety and boundary hardening

This sequence continues the privacy-minimal cookie-banner feature after M899–M911. It does not add telemetry, retained browsing/banner/click/request history, outcome counters, identifiers, a backend, or remote code. Repository tests and audits are preflight evidence only; Issue #10 remains the real Chromium + Firefox exact-head qualification gate.

## M912 — Exact policy-response schema

The top-level content controller accepts only an exact plain `{enabled:boolean}` response with one enumerable own data field. Arrays, custom prototypes, accessors, symbols/extra fields, non-booleans, and unsafe inspection fail closed before DOM work.

## M913 — Descriptor-safe candidate selection

Cookie-banner candidate selection now accepts only a normal dense bounded array. Each candidate is an exact plain data record containing only `element`, `text`, and `consentRoot`; selection operates on detached frozen snapshots and never requires candidate accessors.

## M914 — Navigation and form-submit refusal

Automatic rejection excludes anchors/areas, `href`/`formaction` controls, form-associated submit buttons, and submit inputs. A reject-looking label is not enough to authorize navigation or form submission.

## M915 — Semantic availability

Pre-click validation rejects actions that are hidden, inert, aria-hidden, aria-disabled, or inside a disabled fieldset. Ancestor inspection is bounded to 24 steps and remains in addition to CSS, geometry, viewport, and hit-test checks.

## M916 — Bounded open-shadow discovery

Discovery can inspect open shadow roots while retaining one shared 2,000-node / 64-candidate budget. Shadow traversal is deduplicated and capped at 32 roots and depth 4. Closed roots are never pierced and consent context is not borrowed across a shadow boundary.

## M917 — Open-shadow activation revalidation

Semantic ancestry follows open-shadow hosts through a bounded composed path. Hit testing drills through at most four open shadow roots before requiring the hit to be the exact action or its descendant. Closed or uninspectable paths fail closed.

## M918 — Ambiguous-action refusal

The controller performs automatic activation only when there is a unique highest non-zero reviewed rejection score. A tie at the best score produces no automatic click instead of selecting the first matching control.

## M919 — Receiver-safe messaging capture

The controller captures the runtime `sendMessage` collaborator through descriptor-only prototype inspection with an eight-level ceiling and invokes the captured method with its owning runtime receiver via `Reflect.apply`. Unsafe or missing messaging aborts before policy requests or DOM scanning.

## M920 — Canonical audit extension

`cookie-banner-hardening-audit` now protects the canonical M912–M919 boundaries in addition to M899–M909, including response/candidate schemas, navigation refusal, semantic availability, bounded open-shadow behavior, ambiguity refusal, receiver-safe messaging, browser-manifest parity, top-frame execution, privacy, and no synthetic click dispatch. `tests/cookie-banner-hardening-audit-v920.test.js` protects the extended gate.

## M921 — Roadmap and qualification synchronization

The roadmap advances the next canonical milestone to M922 and carries the M912–M920 delta into Issue #10. Real exact-head Chromium and Firefox qualification must cover malformed response refusal, ambiguous-action refusal, navigation/form-submit refusal, semantic-hidden refusal, open-shadow discovery/activation within the documented bounds, and ordinary light-DOM behavior without regression. Any source/package identity change invalidates those observations with the rest of the qualification record.

## Privacy invariants retained

- no telemetry, analytics, page/banner/click/request history, retained outcome statistics, or identifiers;
- no cookie-jar enumeration or new browsing-data permission;
- no owned Drop Ads backend or embedded GitHub credential;
- no polling or unbounded MutationObserver lifetime;
- no synthetic mouse-event fabrication or scrolling to force an action;
- no closed-shadow piercing;
- automatic action remains best-effort and fail-closed when intent or target identity is ambiguous.
