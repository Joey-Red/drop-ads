# Real-browser qualification

This document is the release gate for the current developer line. Unit/contract tests, audits, package smoke checks, artifact verification, and the local fixture are preflight tools; they do not substitute for loading the extension in real Firefox and Chromium sessions.

## 1. Build and preflight

From the repository root:

```sh
npm run check
npm run package
npm run verify:release
```

`npm run check` builds the browser trees and runs fail-closed generated-contents, privacy, permission, and UI audits before smoke checks. The generated-contents audit requires an exact per-browser file allowlist, rejects missing runtime files, and rejects repository/development material, source maps, env/secrets/key/certificate files, logs/databases/backups, nested archives, symlinks, and other non-regular entries. The manifest audit also fixes the reviewed cosmetic content-script set while continuing to reject new privileged permissions such as `scripting`, `tabs`, history, or `webRequest`. Firefox alone is allowed to carry the compatibility `rules/static.json`; Chromium must not contain it.

The build writes `build-info.json` into both `dist/chromium` and `dist/firefox`. `build-info.json` contains a deterministic `sourceFingerprint` plus repository-relative per-input SHA-256 hashes; it contains no timestamp, username, hostname, absolute path, or random identifier.

A matching `build-info.json` is **not sufficient by itself**. Smoke, packaging, and release verification independently reconstruct the expected Chromium/Firefox output bytes from current `src`, `lists`, browser manifests, and computed build info, then compare every generated file byte-for-byte. This prevents a modified runtime/content script, bundled list, manifest, Firefox compatibility ruleset, or build-info file from being packaged under an unchanged source fingerprint.

Packaging reruns the generated-contents and generated-byte checks and writes `dist/release-manifest.json`. It binds that verified `sourceFingerprint` to the exact Chromium ZIP and Firefox XPI byte lengths/SHA-256 values and records hashes for the packaging tools. It likewise contains no timestamp or machine/user identity.

Packaging also runs the independent release verifier before reporting success. `npm run verify:release` can rerun that check later: it recomputes current source/build identity, verifies generated browser bytes against the current source transformation, reruns the generated-tree audit, recomputes the release manifest, strictly parses the project's deterministic store-only ZIP/XPI structures, validates CRC/header/offset/name invariants, and compares every archived payload byte to the verified unpacked browser tree.

Record the exact Git commit, verified `sourceFingerprint`, Chromium ZIP SHA-256, Firefox XPI SHA-256, and successful `npm run verify:release` result. Do not reuse results from an older head/fingerprint/package hash after product/build/package inputs change.

## 2. Start the local fixture

In a second terminal:

```sh
npm run qualify:serve
```

By default it listens only on six loopback addresses using port `41731`: `127.0.0.1` is the main page, with `127.0.0.2` through `127.0.0.6` providing domain, exact URL, script, frame, and cookie probes. Open:

```text
http://127.0.0.1:41731/
```

The listeners are bound individually to loopback and the fixture makes no external requests. Set `DROP_ADS_QUALIFY_PORT` if the default port is already in use.

The existing fixture cards also provide deterministic cosmetic targets. Their stable IDs include `#control-card`, `#domain-card`, and `#exact-card`; no new external page is required for cosmetic qualification.

## 3. Chromium pass

Load `dist/chromium` unpacked from the browser's extensions page, then use the fixture to verify:

1. **Baseline:** the first-party control and all unblocked probe resources load before local test rules are added.
2. **Manual cosmetic hide/exception:** in Settings add a cosmetic hide scoped to `127.0.0.1` with selector `#domain-card`. The entire domain-test card should disappear without reload. Add a matching personal cosmetic exception and verify it returns. Remove both rules before continuing.
3. **Element picker:** from the popup choose **Pick element to block**, select the card with id `#exact-card`, confirm **Hide on this site**, and verify it disappears. Confirm the saved Settings rule is scoped to `127.0.0.1`, contains a selector rather than copied page text, and can be removed to restore the card.
4. **Cosmetic recovery:** with a temporary cosmetic rule active, pause the site for the browser session and verify the hidden element returns immediately; resume and verify hiding returns. Repeat persistent site disable/re-enable. Global protection off must likewise remove cosmetic CSS. Clear the cosmetic test rule afterward.
5. **One-click domain block:** right-click the `127.0.0.2` image and choose **Block ad/resource locally**. Reload. The `127.0.0.2` resources should fail while the `127.0.0.1` control remains.
6. **Advanced exact URL:** right-click the exact target on `127.0.0.3` and choose **Drop Ads: advanced blocking → Block exact resource URL locally**. Reload. The target should fail while the same-host control still loads.
7. **Script/sub-frame:** add domain rules for `127.0.0.4` and `127.0.0.5`; reload and verify the script no longer changes its visible status and the frame no longer loads.
8. **Personal allow precedence:** add an allow rule for one blocked loopback host and verify the allow restores it without removing the underlying block rule.
9. **Session pause:** pause protection for `127.0.0.1` until browser restart and verify blocked third-party fixture resources return; resume and verify policy becomes active again.
10. **Persistent site disable:** disable protection on the fixture site, reload, re-enable, and verify expected network and cosmetic rules return.
11. **Cookie modes:** run the same-origin cookie probe in third-party mode and hard mode. In hard mode the same-origin cookie must be absent/removed. The third-party iframe is supplemental because browser-native third-party-cookie policy may independently block it.
12. **Filter-list fallback:** verify an unavailable configured source retains last-known-good network and cosmetic policy. For an adblock-style test subscription containing basic `##`/`#@#` rules, verify declarative cosmetics activate; procedural/scriptlet syntax must remain unsupported.
13. **Private/LAN boundary:** verify shared generic/scoped cosmetics do not become active policy for loopback/private pages, while an intentional personal local cosmetic rule can still target the loopback fixture.
14. **Backup/restore:** export settings, confirm configured personal cosmetic rules may be present but cache/session/page HTML/element history/statistics/identifiers/timestamps are absent, import it, then test invalid/oversized/unavailable-source failure without changing active policy.
15. **Community preparation:** verify a prepared GitHub community issue contains only a normalized network-domain candidate; cosmetic selectors are not auto-submitted through the network community option.

Remove qualification-only personal rules/exceptions between scenarios so one scenario does not mask another.

## 4. Firefox pass

Before loading Firefox, confirm `dist/firefox/build-info.json` has the same verified `sourceFingerprint` recorded for Chromium. Load `dist/firefox/manifest.json` as a temporary add-on and repeat the same network, cosmetic, picker, recovery, cookie, list, privacy-boundary, and backup checks. Then reload/restart as required by this qualification matrix and verify dynamic-rule persistence/recovery plus cosmetic content-script recovery after add-on/page reload.

## 5. Record results

For each browser record browser/version, OS, exact Git commit, exact `sourceFingerprint`, exact packaged artifact SHA-256, `npm run check`, `npm run package`, `npm run verify:release`, each qualification checklist result, and any browser-specific difference/failure as a new issue.

Do not mark a scenario passed from repository contract coverage alone. A failed native browser/privacy behavior is a product failure even when the mock WebExtension tests pass.

## Cookie-probe interpretation

The fixture server is intentionally plain loopback HTTP. Modern browsers may block or partition third-party cookies on their own, so the `127.0.0.6` iframe cannot by itself prove that Drop Ads caused a third-party cookie to disappear. The same-origin `127.0.0.1` probe is the deterministic hard-mode check: with third-party-only protection it may retain its cookie; with all-cookie hard mode Drop Ads should remove the request/response cookie headers.

The server retains no cookie database or test history. `/cookie-state` reports only whether the current request contains the fixed qualification cookie.
