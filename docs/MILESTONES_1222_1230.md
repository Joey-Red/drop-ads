# Milestones M1222–M1230 — Generated-verification identity hardening

This tranche hardens generated Firefox/Chromium verification without adding telemetry, history, identifiers, or browser-observation claims. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

- **M1222:** Generated-tree allowlists are snapshotted once into bounded, canonical, duplicate-free, deterministic verifier-local membership.
- **M1223:** Standalone generated-tree audits bind the real non-symlink browser root to one stable filesystem identity across the whole traversal.
- **M1224:** Generated-verification root-identity pass state is structurally admitted as exact frozen own data with safe numeric/null fields.
- **M1225:** Finish-time verification revalidates output-root identity before ancestry revalidation.
- **M1226:** Output-root identity is checked again after ancestry revalidation so mutation during the finish step fails closed.
- **M1227:** The ancestry sentinel is a fixed reviewed single child of the admitted output root and cannot alias or escape it.
- **M1228:** Top-level verification pass fields are consumed only through frozen enumerable own data descriptors.
- **M1229:** Dedicated generated-verification hardening protects the pass/output-root ancestry binding and all preceding identity boundaries while preserving historical audit markers.
- **M1230:** Generated-release integration joins the M1229 pass-binding audit and focused regressions; canonical roadmap allocation advances to M1231.

Repository tests/audits created through connector work were not executed locally or in browsers as part of this tranche. They are supporting/preflight evidence only and do not replace Issue #10 observations.
