# Release source-tree structure

Drop Ads' trusted release inputs are ordinary repository files. Filesystem indirection is deliberately outside that model.

`npm run source-tree-audit` recursively inspects `src`, `lists`, `manifests`, and `tools`. Only real directories and regular files are allowed. Symlinks, sockets, FIFOs, device nodes, and unknown special entries fail closed with repository-relative diagnostics. Required top-level `.gitattributes`, `package.json`, and `package-lock.json` must also be regular files rather than symlinks.

The audit is invoked in two places:

1. early in `npm run check`
2. directly inside `tools/build.mjs`

The second placement is important: direct build, packaging, and same-source reproducibility paths cannot bypass the source-tree boundary by skipping an npm wrapper. The source-tree audit implementation itself is bound into deterministic build inputs.

This prevents platform-specific symlink-following/copy behavior or hidden external source indirection from producing browser artifacts that are not explained by the reviewed repository tree.
