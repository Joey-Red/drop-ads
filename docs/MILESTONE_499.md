# Milestone 499 — Popup collaborator audit gate

Completed:

- Added an executable UI hardening audit that fails if the popup regresses to direct `tabs.query`, `tabs.sendMessage`, `runtime.sendMessage`, `runtime.openOptionsPage`, or `storage.onChanged.addListener` calls.
- Requires the reviewed captured popup helpers for active-tab discovery, runtime messaging, top-frame picker messaging, Settings opening, and storage live-sync.
- This is source/preflight coverage only; it is not a claim of executed Firefox/Chromium runtime qualification.
- No telemetry, browsing/request history, statistics, backend, or new browser permission was introduced.
