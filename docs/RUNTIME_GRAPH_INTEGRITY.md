# Shipped runtime graph integrity

Generated-file allowlists answer **what files are in the extension package**. Manifest permission audits answer **what privileged capabilities the extension declares**. Neither alone proves that every runtime code/asset reference resolves to a shipped local file.

`npm run runtime-graph-audit` closes that gap before build/package qualification.

For every JavaScript source under `src`, the audit follows static `import` / `export ... from` references and requires an explicit relative `.js` target that resolves to a regular file inside `src`. Bare package imports, `node:` imports, HTTP(S), data/blob/protocol-relative references, query/fragment module references, source-tree escapes, missing files, and dynamic `import()` are rejected. Drop Ads therefore cannot accidentally introduce remote hosted executable code or a service-worker dependency that the package never ships.

For extension HTML pages, local script and stylesheet references must remain inside `src` and resolve to regular files. Executable inline script is rejected. Remote/missing script or stylesheet assets fail the gate.

Both Chromium and Firefox manifests are checked for runtime entry points: background service worker/scripts, action popup, options page, content-script JS/CSS, and DNR static ruleset paths. Each path must resolve to a regular source file under the shipped source tree.

The audit runs as part of `npm run check`, before the existing build/output/artifact/package gates. Together these checks establish a stronger chain:

1. manifest capabilities remain reviewed;
2. runtime references remain local, bounded to the source tree, and resolvable;
3. build output is reconstructed from reviewed source;
4. generated contents match the exact allowlist;
5. deterministic archives and release-manifest hashes are independently verified.

This is static release tooling only. It adds no extension runtime permission, network behavior, telemetry, or user-data collection.
