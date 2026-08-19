# Milestones 759–768 — Popup semantics and Settings interaction accessibility

This block continues UI/accessibility hardening without changing blocking precedence, permissions, privacy retention, or the real-browser qualification gate.

## M759 — Label the popup primary landmark

- Popup `main` is explicitly labelled by the visible product heading.

## M760 — Make popup site availability deterministic and announced

- Site-availability guidance starts hidden until active-tab classification completes.
- Non-HTTP(S) and unreadable tabs explicitly reveal a polite atomic status message.

## M761 — Associate popup actions with their live feedback

- Pause/picker actions reference site status/help.
- The Settings action references popup-global feedback.

## M762 — Harden popup narrow-width reflow

- Popup hard width floor is 320px rather than 350px.
- <=360px layouts reduce padding/gaps while retaining 44px controls.

## M763 — Expose popup busy state on the active control

- Popup transactions retain popup-wide `aria-busy` and also mark the exact active control busy.
- Busy cleanup remains idempotent and connection-aware.

## M764 — Give policy inputs explicit mobile keyboard hints

- Domain/URL/TLD policy fields request URL-oriented touch keyboards.
- Cosmetic scope fields use `next`; selector fields use text-oriented `done` semantics.
- M750 autocorrection suppression remains intact.

## M765 — Group backup and restore controls semantically

- Backup controls expose one labelled action group tied to backup status/error feedback.

## M766 — Associate Settings submit actions with their feedback

- Policy submit buttons explicitly reference their transaction status/error regions.

## M767 — Associate community opt-in with its privacy explanation

- The contribution checkbox explicitly references the existing opt-in/privacy explanation.
- Off-by-default behavior, no embedded GitHub token/silent posting, and URL-to-domain reduction remain explicit.

## M768 — Extend the executable UI accessibility gate

- `tools/settings-accessibility-audit.mjs` now enforces the M759–M767 source invariants and regression-file presence.
- Added `tests/settings-accessibility-audit-v768.test.js`.

## Validation status

These source changes, tests, and audit updates were authored through the GitHub connector. They were not executed locally or in Chromium/Firefox during this work. Issue #10 remains the authoritative exact-head real-browser qualification gate.

No telemetry, analytics, request/browsing history, matched-element history, page/DOM history, retained statistics, identifiers, polling, or owned Drop Ads backend behavior was added.
