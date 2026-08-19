# Exact-head qualification record

After creating and verifying packages, use:

```sh
npm run qualify:record
```

The command is intentionally read-only. It requires a clean Git worktree, reads the exact `HEAD`, recomputes the current source fingerprint, verifies Chromium/Firefox build-info fingerprints and the release manifest agree, and independently checks the ZIP/XPI bytes still match the manifest descriptors.

It prints deterministic JSON to stdout containing only:

- package name/version
- exact Git commit
- source fingerprint
- Chromium and Firefox package filenames, byte sizes, and SHA-256 hashes
- Node/npm versions
- OS platform and CPU architecture

It does **not** write a report into `dist`, modify Git, or include a timestamp, username, hostname, current directory, absolute path, environment dump, browser history, request data, or identifier.

Recommended qualification sequence:

```sh
npm ci
npm run check
npm run package
npm run verify:release
npm run verify:reproducible
npm run qualify:sources
npm run qualify:record
npm run qualify:serve
```

Record browser versions separately during the actual Chromium/Firefox session. If the worktree changes or packages are rebuilt, discard the old record and generate a new one from the new exact head.
