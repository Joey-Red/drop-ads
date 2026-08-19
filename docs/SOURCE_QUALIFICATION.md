# Live built-in source qualification

`npm run qualify:sources` is the developer/native-browser companion to deterministic repository checks. It deliberately contacts current third-party upstreams, so its output belongs to the exact commit/browser qualification record and is not part of offline `npm run check`.

## Portability

The command's main-module detection uses Node's platform-aware `resolve()` + `pathToFileURL()` handling. It does not construct `file://` URLs by string concatenation, so normal Windows drive/backslash paths and POSIX paths follow Node's own platform rules.

Examples:

```sh
npm run qualify:sources
npm run qualify:sources -- stevenblack-hosts
```

Unknown source ids fail before any network request. Selected sources are processed and reported by stable source id order so overlap/unique-contribution numbers do not depend on argument order.

## Network behavior

For each source the tool first attempts a privacy-safe `HEAD` request solely to record optional `Content-Length` metadata. That diagnostic has a 5-second deadline, uses `credentials: omit`, `redirect: error`, and `referrerPolicy: no-referrer`, and is ignored if unsupported, failed, redirected, or timed out.

The diagnostic HEAD **never admits a source**. The real GET still passes through Drop Ads' production download path with its own 30-second deadline, 5,000,000-byte ceiling, strict UTF-8 decoding, line/work bounds, non-list rejection, private/LAN target checks, parser safety, and supported-output validation. A selected source that fails that real admission path appears in `failures` and causes a nonzero CLI exit status.

The JSON report contains aggregate counts, overlap/unique contribution, format/default state, and optional declared byte size. It does not dump rule values, browsing data, or user/request history.
