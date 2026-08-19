# Firefox / Chromium manifest parity

Drop Ads ships one product/security posture across Firefox and Chromium. `npm run manifest-parity-audit` compares the source manifests before build and fails if the common runtime surface drifts.

The parity contract covers:

- manifest/name/version/description
- extension permissions and host permissions
- exact extension-page content security policy
- module background entry semantics (`background.js`)
- toolbar popup/title
- options page/open-in-tab behavior
- content-script URL scope, JavaScript load order, run timing, and all-frame behavior

Permission/host/match arrays are canonicalized where ordering is not meaningful. Content-script JavaScript order remains exact because execution order is meaningful.

## Local-code-only extension CSP

Both manifests declare exactly:

`script-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none';`

This makes the browser enforce the same local executable-code boundary as the runtime graph and code-safety audits. Drop Ads does not opt into `wasm-unsafe-eval`, `unsafe-eval`, inline scripts, localhost script sources, remote script origins, or a sandbox policy.

The policy intentionally does **not** set `default-src` or `connect-src`. Drop Ads must fetch reviewed declarative filter-list data directly from public HTTPS sources, and that data is parsed as bounded rules/selectors rather than executed as JavaScript. Executable extension code remains package-local.

Firefox has two explicit compatibility-only exceptions that are validated exactly rather than ignored broadly:

1. the enabled empty `rules/static.json` DNR ruleset compatibility resource
2. Gecko add-on identity `drop-ads@local.invalid` with minimum Firefox `128.0`

Any change to those exceptions, the reviewed CSP, or any new browser-specific difference must be reviewed and encoded deliberately. This parity audit complements the existing per-manifest permission audit, runtime graph audit, and code-safety audit; it does not replace them.
