# Development setup

Drop Ads intentionally has no npm runtime or development dependencies. The repository still commits a lockfile so a clean checkout has one deterministic install path and `npm ci` behaves consistently on qualification machines.

From the repository root:

```sh
npm ci
npm run check
npm run package
npm run verify:release
```

`npm ci` should not download a dependency graph because the project is dependency-free; it validates the committed npm metadata and prepares the standard npm workspace state. Normal qualification should not require running `npm install` to generate or rewrite package metadata.

`package.json` and `package-lock.json` must retain the same package name/version, and the lockfile must not acquire package entries without an explicit reviewed supply-chain decision. The lockfile is included in Drop Ads' deterministic build inputs, so changing it changes the `sourceFingerprint` used by release qualification.
