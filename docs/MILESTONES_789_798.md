# Milestones 789–798 — Settings dynamic row semantics and recovery

Completed on `main` through Milestone 798.

## M789 — Group personal-rule row actions under visible rule identity

Personal block/allow row controls are exposed as groups labelled by the visible rule text. Visible rule notes are associated with the row control group. Local observers reapply semantics after rerenders and disconnect on pagehide.

## M790 — Clarify personal rule removal actions

Personal block/allow removal controls visibly say **Remove rule** and use the visible canonical rule label in their accessible name.

## M791 — Clarify personal block secondary actions and feedback

Manual community preparation visibly says **Prepare submission** and references block/community guidance plus local feedback. Override recovery visibly says **Remove allow override** and references allowlist feedback.

## M792 — Restore focus after removing a personal allow override

The affected canonical rule key is held in memory only long enough to restore focus to a useful action on the replacement block row after committed rerender. Failed transactions clear pending recovery when the original action is re-enabled.

## M793 — Associate Disabled sites recovery with visible site guidance

Disabled-sites guidance has a stable id. Re-enable actions retain explicit names while referencing both the visible site identity and recovery guidance.

## M794 — Associate cookie-exception actions with site and policy guidance

Cookie-exception removal actions reference the visible site, Cookie Protection guidance, and transaction feedback while retaining explicit action names.

## M795 — Associate filter-list row controls with source and transaction feedback

Filter-list row groups, enable checkboxes, and removable-list actions reference the visible source plus refresh/status and transaction-error regions. Existing native checkbox state and focus recovery remain intact.

## M796 — Give Country TLD rows explicit group semantics

`src/options/policy-row-semantics.js` adds local row semantics for Country TLD controls. Each group is labelled by the visible TLD and described by the visible blocking-scope note plus live country status. The helper is loaded through the existing dynamic-list semantics module and owns its observer teardown.

## M797 — Give cosmetic rule rows explicit selector and scope semantics

Cosmetic hide/allow rows expose stable visible selector/scope relationships. Remove controls reference the visible scope and matching transaction-error region while retaining the existing scoped accessible action name. Observers are local and disconnect on pagehide.

## M798 — Extend the Settings row-semantics gate through M797

`tools/settings-accessibility-audit.mjs` now requires the M789–M797 invariants, the shipped `policy-row-semantics.js` helper, and the focused regressions. `ROADMAP.md` advances to Milestone 799. Issue #10 remains the authoritative exact-head Chromium + Firefox real-browser gate.

## Validation boundary

All code, tests, audits, issue updates, and documentation in this block were created through the GitHub connector. The connector did **not** execute `npm test`, `npm run check`, packaging/reproducibility/source qualification, or real Chromium/Firefox observations. No browser/release qualification is claimed by this milestone block.
