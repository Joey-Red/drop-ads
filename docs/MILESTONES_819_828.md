# Milestones 819–828 — Settings list filtering and recovery

This block adopts and hardens transient, local-only filtering for long Settings policy and recovery lists. It does not change blocking policy, persist search terms, record list activity, or add telemetry/history/backend behavior. `ROADMAP.md` remains the sole canonical milestone-number authority; overlapping continuation trackers are supporting history only.

## M819 — Local, ephemeral, deterministic filtering

`src/options/list-filter.js` provides bounded page-local filtering for personal block/allow rules, Disabled sites, cookie exceptions, configured Filter Lists, Country/TLD rules, cosmetic hide rules, and cosmetic exceptions. Queries are capped at 256 characters, use locale-independent case folding, stay DOM-only, and are never persisted or sent to runtime/network code. Every filter exposes visible guidance that it affects only the current Settings page and is not saved.

## M820 — First-class filter presentation and privacy-minimal feedback

`src/options/list-filter.css` gives search/Clear controls the same 44px target floor, visible focus, narrow-layout reflow, increased-contrast, and forced-colors behavior as the rest of Settings. Feedback is qualitative rather than statistical: inactive filters stay quiet, active matches report `Filter active`, zero matches report `No matching entries`, and a genuinely empty list reports `No entries`. Disabled sites and cookie exceptions use the same recovery-safe filter surface.

## M821 — Dynamic mutation targets

`src/options/mutation-target-semantics.js` exposes the list affected by dynamic mutation controls with `aria-controls`: personal rule removal, allow-override recovery, subscription enable/remove, Disabled-site recovery, cookie-exception removal, Country/TLD mode/remove, and cosmetic rule removal. Manual community preparation remains separate because it does not mutate a local policy list.

## M822 — Configured Filter List presentation

`src/options/subscription-presentation.js` adds visible `Built-in list` / `External HTTPS list` origin text and `Status: enabled` / `Status: disabled` state derived from the rendered row and native checkbox. Built-in rows explain that disabling stops use without removing the configured source. Presentation observes only the local subscription-list DOM and owns pagehide teardown.

## M823 — Keyboard-complete filters

Transient search inputs publish `aria-keyshortcuts="Escape ArrowDown"`. Escape and the visible Clear action share the same local recovery path and return focus to the search field. ArrowDown moves to the first visible enabled control in the filtered rows, skipping hidden/nonmatching entries.

## M824 — Coalesced rerender work

List-local MutationObserver bursts are coalesced to at most one queued filter pass per microtask turn. Direct user input remains immediate. Queued work uses bounded boolean state, falls back to a direct pass if microtask scheduling fails, and becomes inert after pagehide.

## M825 — Row-identity matching

Matching is scoped to visible policy identity/content rather than interactive control labels. Rich policy rows use `.rule-copy`, subscription rows exclude `.subscription-controls`, and simpler rows use their visible `code`/`strong` identity surface. Action wording cannot create false filter matches.

## M826 — Filter-aware mutation focus recovery

When a transient filter is active, removal and allow-override actions remember only their visible-row position in memory. After a committed rerender, filtering is reapplied first and focus moves to the nearest remaining visible enabled control; if no visible match remains, focus returns to the owning search field. Failed in-place mutations clear pending recovery when the original control is re-enabled.

## M827 — Executable Settings list-interaction gate

`tools/settings-list-filter-audit.mjs` enforces the canonical M819–M826 source, privacy, accessibility, lifecycle, mutation-target, subscription-presentation, and regression contracts. It rejects persistence/network/telemetry primitives in the filter helper, checks deterministic bounded identity matching, keyboard recovery, coalescing, filtered focus recovery, responsive styling, and required focused regressions. `settings-list-filter-audit` is wired into `npm run check`.

## M828 — State synchronization

This record, ROADMAP, qualification current-state enforcement, post-merge/runbook release-gate wording, and Issue #10 are synchronized. The next canonical milestone is M829. Issue #10 remains the authoritative exact-head real Chromium + Firefox runtime qualification gate; repository audits do not replace browser observations.

## Evidence boundary

All work in this continuation was performed through the GitHub connector. Connector-created tests and audits were not executed locally or in browsers; `npm run check` was not run here. No Chromium or Firefox observation is claimed by this milestone block.
