# Milestones 779–788 — Settings recovery and dynamic-list interaction hardening

This block continues practical Settings accessibility and recovery work without changing the blocker privacy model or claiming browser qualification.

- **M779** gates backup import on an actual local file selection.
- **M780** announces generic backup-file readiness, clears stale local error text, and re-synchronizes import availability after successful programmatic file clearing without retaining or echoing file identity.
- **M781** changes Disabled sites recovery wording from generic removal to explicit **Re-enable** protection actions.
- **M782** preserves keyboard orientation when the last disabled-site row is re-enabled by focusing the visible section heading.
- **M783** makes cookie-exception removal wording explicit and site-specific.
- **M784** adds `dynamic-list-semantics.js`: Filter Lists row controls are grouped under visible titles and checkboxes are related to visible source text.
- **M785** makes removable Filter Lists actions visibly say **Remove list** with list-specific accessible names.
- **M786** restores focus to replacement enable checkboxes after committed Filter Lists rerenders and avoids moving focus on failed transactions.
- **M787** restores useful focus after successful filter-list removal and falls back to the external-list URL field when no rows remain.
- **M788** extends `settings-accessibility-audit` through M787 and requires the focused regression set.

All DOM observers/listeners added in this block are scoped to local Settings UI state and are explicitly torn down on `pagehide`. They retain no browsing/request history, page contents, statistics, identifiers, or user tracking data.

## Evidence boundary

This work was created through the GitHub connector. The added tests/audit were **not executed locally**, `npm run check` was **not executed**, and no Chromium/Firefox observations were recorded. Issue #10 remains the authoritative exact-head real-browser release gate.
