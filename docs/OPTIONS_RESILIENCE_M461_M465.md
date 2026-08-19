# Options Settings resilience — M461–M465 concurrent track

This record documents the Settings-side resilience work that landed while the canonical core/message-guard milestone sequence was advancing concurrently. The filename is intentionally unique so it does not overwrite `docs/MILESTONES_461_465.md`, which belongs to the message-guard block. `ROADMAP.md` remains the authority for canonical numbering when concurrent trackers disagree.

Connector-created or connector-edited regression coverage named below is repository coverage only and was **not executed** as local/package/browser qualification in this workflow.

## Cosmetic committed-state refresh scheduling

Relevant external storage changes continue to coalesce into one cosmetic Settings refresh. The pending queue identity is cleared before render work begins. If `queueMicrotask()` scheduling throws, the page falls back to one direct best-effort committed-state refresh instead of leaving `renderQueued` permanently latched.

Internal cosmetic mutations remain suppressed from redundant storage-driven rerenders, and no polling or local policy replica is introduced.

Focused coverage includes `tests/options-cosmetic-render-queue-v461.test.js`.

## Country render and relabel scheduling

Country Settings applies the same recoverable scheduling model to committed-state rerenders. The post-render personal-rule relabel step also contains microtask scheduling failure with a direct fallback. Existing state reads, country-rule normalization, transaction semantics, and status containment remain unchanged.

Focused coverage includes `tests/options-country-render-queue-v462.test.js`.

## Country stale-control restoration

Country row remove/mode controls expose row-level busy state during mutations and recover the originating control in `finally` only while the old row/control remains connected. A successful rerender can replace the row without a stale completion touching detached controls; a failed follow-up committed-state refresh cannot leave the visible original control permanently disabled.

Focused coverage includes `tests/country-mutation-control-recovery-v463.test.js`.

## Cosmetic and Country storage live-sync registration containment

Cosmetic and Country Settings treat `storage.onChanged` live synchronization as an optional enhancement rather than a prerequisite for direct use. If listener registration throws:

- the module continues after the failure;
- initial and explicit committed-state reads remain available;
- direct forms/buttons remain wired;
- a bounded status message explains that automatic synchronization is unavailable while direct changes still work;
- no polling, invented local policy state, or retry loop is introduced.

Successful registration retains the existing relevant-change discrimination, cosmetic internal-mutation suppression, and render coalescing.

Focused coverage is retained under the current Options live-sync regression files.

## Privacy and release state

This Settings resilience work adds no telemetry, analytics, browsing/request history, matched-element history, statistics database, identifiers, custom backend, new permissions, polling, or retained local policy replica. It does not change network/cosmetic precedence, transaction behavior, or remote-list handling.

No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, or real Chromium/Firefox observation is claimed here. PR #7 must remain draft and Issue #10 must remain open until the exact current head completes clean machine preflight plus real cross-browser qualification.
