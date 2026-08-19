# Developer sideloading

Run:

```sh
npm run check
npm run package
```

The build creates unpacked browser directories plus developer packages under `dist/`.

## Chromium

1. Open `chrome://extensions` (or the equivalent extensions page in your Chromium browser).
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `dist/chromium`.

The generated Chromium ZIP is a distributable build artifact for inspection/testing; developer loading should use the unpacked directory.

## Firefox

1. Open `about:debugging`.
2. Choose **This Firefox**.
3. Choose **Load Temporary Add-on**.
4. Select `dist/firefox/manifest.json`, or use the generated XPI where the browser accepts a temporary package.

Temporary Firefox add-ons are removed when Firefox restarts. Store signing/permanent end-user installation is intentionally a later release milestone.

## Deterministic qualification fixture

For repeatable real-browser checks, start the local fixture in a second terminal:

```sh
npm run qualify:serve
```

Then open `http://127.0.0.1:41731/`. The fixture binds only loopback addresses and provides separate local hosts for first-party controls, domain blocking, exact URL blocking, scripts, frames, and cookie probes. It does not contact the internet or replace the real Firefox/Chromium qualification requirement.

See [Real-browser qualification](QUALIFICATION.md) for the complete fixture procedure and interpretation rules.

## Manual smoke checklist

- Open the toolbar popup on an ordinary HTTPS page.
- Toggle blocking globally and confirm the UI persists the preference.
- Right-click an image/link and verify **Block ad/resource locally** is a top-level action.
- Confirm the default action creates a local domain block, not an exact-URL rule.
- Verify **Drop Ads: advanced blocking** exposes exact-URL and explicit-domain choices.
- Add/remove a personal allow rule and verify it wins over blocking policy.
- Pause filtering on the current site for the browser session, resume it, then test persistent site disable/re-enable.
- Switch cookie protection between third-party, all-cookie hard mode, and off; verify a local exception can be added/removed.
- Confirm the built-in HaGeZi source can refresh and be disabled/re-enabled.
- Add a small HTTPS hosts/network list, refresh it, then temporarily break its URL and verify the last-known-good rules remain usable.
- Export/import a settings backup and verify failure paths do not replace the active policy.
- Confirm community auto-submit defaults OFF. When manually using Submit, inspect the prefilled GitHub issue and verify it contains only the normalized candidate domain.
- On Firefox, reload/restart as appropriate and confirm the expected dynamic-rule persistence/recovery behavior.

Do not use real private tokens, account URLs, or sensitive browsing data for smoke testing.

The authoritative release-qualification matrix is [Real-browser qualification](QUALIFICATION.md). Passing static/unit/contract tests or the fixture's own server tests does not replace real Firefox and Chromium runtime qualification.
