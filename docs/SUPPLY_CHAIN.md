# npm supply-chain boundary

Drop Ads currently requires **zero npm dependencies**. That is now a checked project invariant, not an assumption.

`npm run package-audit` fails if package metadata introduces dependency classes, workspaces, non-root lockfile packages, or automatic install/pack lifecycle hooks such as `preinstall`, `postinstall`, or `prepare`. It also verifies package name/version/engine metadata stays aligned with the committed lockfile.

This means a normal clean checkout:

```sh
npm ci
```

should not download or execute third-party package code. If Drop Ads ever needs an npm dependency or lifecycle hook, the supply-chain audit must be deliberately changed in the same reviewed work so the new trust boundary is visible rather than accidental.

The audit runs near the beginning of `npm run check`. It protects build/qualification tooling only; it does not add extension runtime permissions, network calls, analytics, or telemetry.
