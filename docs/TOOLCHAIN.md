# Qualification toolchain

Drop Ads qualification uses modern Node ESM APIs consistently on Windows and Linux. The supported local toolchain is:

- Node **22.0.0 or newer**
- npm **10.0.0 or newer**

`package.json` declares the same engine floor. `npm run check` begins with `npm run environment-audit`, which reads Node directly from `process.versions.node` and npm from npm's own user-agent metadata. It does not invoke platform-specific version commands.

Newer Node/npm major versions are allowed. The gate exists to fail early and clearly on unsupported environments rather than allowing an older runtime to surface later as an ESM parse error, missing `import.meta` feature, packaging inconsistency, or misleading browser service-worker failure.

Recommended clean-checkout sequence:

```sh
npm ci
npm run check
npm run package
npm run verify:release
npm run verify:reproducible
```

Toolchain versions are qualification metadata, not extension runtime telemetry; they are not shipped, persisted by the extension, or transmitted by Drop Ads.
