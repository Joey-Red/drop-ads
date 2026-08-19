# Browser permission model

Drop Ads treats browser permissions as part of its privacy boundary. The manifests intentionally request only the capabilities required by the current blocker. Any future feature that needs another permission must update the manifest audit and receive explicit review.

## API permissions

Both Firefox and Chromium currently request exactly four API permissions:

- `declarativeNetRequest` — installs and updates browser-enforced block, allow, and cookie-header rules without observing individual matching requests.
- `storage` — stores user configuration, normalized list cache, and session-only site pauses. It is not used for browsing or request history.
- `contextMenus` — provides the user-initiated “block exact resource” / “block resource domain” commands.
- `alarms` — schedules periodic filter-list refreshes.

Drop Ads does **not** request `tabs`, `cookies`, `history`, `webRequest`, `webNavigation`, `declarativeNetRequestFeedback`, or `scripting`. Opening a GitHub submission page with `tabs.create()` does not require the privileged `tabs` permission. Cookie protection is implemented through declarative header rules, so Drop Ads never needs access to the browser cookie database.

## Host access

`<all_urls>` is intentionally required because Drop Ads is a whole-web blocker and its cookie protection modifies request/response headers. Browser DNR implementations require host access for redirect/header-modification behavior; limiting host access would leave ungranted sites outside those protections.

This broad host grant is not used to read page content or browsing history. There are no content scripts, `webRequest` listeners, history APIs, or matched-rule feedback APIs in the current architecture.

## Firefox static bootstrap ruleset

Firefox keeps an enabled empty/static bootstrap DNR ruleset in `rules/static.json`. It exists as a compatibility safeguard for the dynamic-rule persistence path and is audited separately from the runtime dynamic rules.

## Enforcement

Run:

```sh
npm run manifest-audit
```

The audit fails if either browser manifest adds unexpected API/host permissions, optional permissions, content scripts, external connection capability, or loses the required Firefox bootstrap declaration. `npm run check` runs this audit automatically.
