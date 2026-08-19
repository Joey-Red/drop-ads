# Cookie-banner per-site qualification

This is an exact-head real-browser checklist for the persistent current-site cookie-banner exclusion added in M942–M949. It is supporting guidance for Issue #10, not browser evidence by itself.

Use the local loopback fixture from `npm run qualify:serve` with the exact generated Chromium or Firefox package bound to the active qualification record.

## Exclusion cycle

1. Keep global cookie-banner handling set to **Reject cookie banners when possible**.
2. Open the loopback qualification page and confirm the immediate cookie-banner fixture can reject automatically under the normal enabled policy.
3. In the popup, clear **Reject cookie banners here** for the fixture site. Normal site protection and cookie protection must remain independently enabled.
4. Reload the page. The immediate and delayed/open-shadow cookie-banner reject controls must remain untouched automatically, while ordinary network/cosmetic blocking continues according to the site's other settings.
5. Re-enable **Reject cookie banners here** in the popup and reload again. Automatic rejection may resume on that later load.
6. Repeat the cycle in both Chromium and Firefox. A parent-domain exclusion must also suppress automatic rejection on a covered subdomain when that case is exercised.

The preference is persistent configured state only. It must not create session state, request/page/banner/click history, timestamps, counters, statistics, identifiers, or telemetry. The fixture itself uses loopback resources only and does not record qualification results.

Record only the real browser observation through the guarded Issue #10 qualification workflow. Any source or package change invalidates prior exact-head observations.
