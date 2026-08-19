# Milestones 922–931 — Cookie-banner runtime ownership and qualification hardening

This sequence continues the privacy-minimal local cookie-banner rejection work. It does not add telemetry, request/page/banner history, retained click outcomes, identifiers, a backend, or remote executable code. Repository tests, audits, and fixture changes are preflight/supporting evidence only; real Chromium and Firefox observations remain tracked by Issue #10.

## M922 — Descriptor-safe timer collaborators

The top-level cookie-banner controller captures `setTimeout` and `clearTimeout` through the existing bounded descriptor-only collaborator boundary. Accessor-backed or missing timer methods fail closed before policy/DOM work, while the 150 ms mutation coalescing, 30-second observation deadline, and explicit timer teardown remain intact.

## M923 — Descriptor-safe MutationObserver ownership

`MutationObserver` is captured through descriptor-only inspection. Observer construction uses `Reflect.construct`, while `observe` and `disconnect` are captured as receiver-preserving data methods. Unsafe observer collaborators fail closed and converge on the shared teardown path.

## M924 — Existing open-shadow late observation

A dedicated `cookie-banner-shadow-roots.js` helper discovers only open shadow roots with hard ceilings of 2,000 visited elements, 32 roots, and depth 4. Chromium and Firefox load the helper identically in the top-level-only cookie-banner content entry. The late observer registers the document plus bounded pre-existing open roots; closed roots are never pierced.

## M925 — Open-shadow observer resynchronization

The controller tracks observed targets only in transient memory. On document mutations it re-runs bounded open-shadow discovery before the coalesced scan, registering newly reachable roots once and clearing target references during teardown. No polling is introduced.

## M926 — HTTP(S)-document policy boundary

The content controller now requires the active top-level document protocol to be exactly `http:` or `https:` before extracting/sending the canonical hostname. Extension, file, data, about, and other schemes fail closed. The policy request remains domain-only.

## M927 — Explicit lifecycle-listener ownership

Document/window `addEventListener` and `removeEventListener` methods are captured through descriptor-only receiver-preserving inspection. Pending `DOMContentLoaded` and `pagehide` handlers have explicit references and are removed by the shared teardown path. Unsafe lifecycle collaborators fail closed.

## M928 — Strong cookie/privacy consent evidence

Automatic rejection now requires strong bounded consent evidence: cookie/cookies/cookie-policy, privacy-choice, or tracking-technologies wording. Generic consent, personal-data, vendor, or CMP wording does not qualify by itself. Candidate selection applies the strong-evidence filter and the executor revalidates it immediately before native click.

## M929 — Canonical audit extension

`cookie-banner-hardening-audit` now protects the M922–M928 boundaries, the canonical five-script cookie-banner manifest order, helper privacy constraints, all prior action-safety constraints, and the canonical regression set through M928. The audit remains wired into `npm run check` and remains preflight evidence only.

## M930 — Deterministic browser fixture coverage

The loopback qualification page now includes three local cookie-banner scenarios:

- an immediate strong cookie reject surface that should activate only while reject mode is enabled;
- a generic non-cookie medical-consent `Decline` control that must remain untouched automatically;
- a delayed open-shadow cookie banner that exercises bounded late observation/resynchronization.

Fixture status text is local and visible only; no external request, extension telemetry, or retained browser-activity record is added.

## M931 — Roadmap and qualification synchronization

`ROADMAP.md` canonically closes M922–M931 and advances allocation to M932. Issue #10 receives the exact-head Chromium/Firefox qualification delta for collaborator capture, HTTP(S)/lifecycle boundaries, strong-consent refusal, existing/new open-shadow late behavior, and the deterministic fixture scenarios. No repository-only result is represented as a browser pass.

## Qualification invariants carried forward

For the exact same source fingerprint and generated package hashes in both Chromium and Firefox, real-browser qualification must additionally confirm:

- timer, observer, messaging, and lifecycle collaborator failure leaves the page untouched and does not disable core network blocking;
- cookie-banner policy requests occur only on top-level HTTP(S) documents and contain only the canonical domain;
- immediate strong cookie reject controls activate in reject mode and stay untouched in Off mode;
- generic non-cookie consent surfaces with an exact `Decline` label remain untouched automatically;
- pre-existing and newly inserted open-shadow consent surfaces are handled only within the documented node/root/depth/time/attempt bounds;
- late observation tears down after success, exhaustion, deadline, policy failure, or page lifecycle exit;
- no banner/page/click/request history, outcome statistics, identifiers, or telemetry are retained.

Any source commit, fingerprint change, or package hash/size change invalidates those observations with the rest of the exact-head qualification record.
