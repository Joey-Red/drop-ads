# Build-input fingerprint supporting qualification

This guide covers the M1162–M1191 source-fingerprint boundaries that bind generated candidates to reviewed local repository inputs. It is **supporting/preflight evidence only**. None of the checks below are Chromium or Firefox browser passes; Issue #10 remains the authoritative real exact-head runtime qualification gate.

## Local evidence

Run the canonical repository gate and the focused audit on the exact source head used to generate candidates:

```sh
npm ci
npm run build-input-hardening-audit
npm run build-release-hardening-audit
npm run check
```

The focused build-input audit must retain its historical markers and report the repository-root/ancestry extension:

```text
build-input-hardening-audit: canonical M1162-M1168 build input boundaries verified
build-input-hardening-audit: extended through M1179 deterministic build input boundaries
build-input-hardening-audit: extended through M1189 repository-root and ancestry boundaries verified
```

The integrated build/release gate must retain its historical markers and add the repository-root/ancestry extension:

```text
build-release-hardening-audit: extended through M1169 build input fingerprint boundaries
build-release-hardening-audit: extended through M1179 deterministic build input boundaries
build-release-hardening-audit: extended through M1189 repository-root and ancestry boundaries
```

## Required boundaries

Build-input fingerprinting must preserve all of these limits and fail closed when they are exceeded or invalidated:

- each hashed build input is a regular non-symlink file and is capped at **16 MiB**;
- hashing is opened-handle based, streamed byte count cannot exceed the opened size, and final handle plus pathname identity/size/time metadata must remain stable;
- aggregate admitted build-input bytes are capped at **256 MiB**;
- `src`, `lists`, and `manifests` share one recursive-discovery budget of at most **100,000 visited entries** and **4,096 visited directories** rather than independently reusing those ceilings per root;
- the requested multi-root set is snapshotted through own data descriptors as a dense bounded array; holes, extra fields, accessors, and non-string entries fail before traversal;
- requested build roots must be absolute normalized platform paths and duplicates fail closed before consuming traversal budget twice;
- the repository root used by discovery must be a real non-symlink directory whose identity/size/time remains stable across the whole single- or multi-root traversal;
- one directory may materialize at most **8,192 entries** through bounded `opendir()` iteration before deterministic sorting;
- build-input ordering uses one direct ECMAScript code-unit comparator for directory entries, collected canonical paths, and fingerprint descriptors; host locale/collation and `localeCompare` must not influence source identity;
- every discovered child is classified from fresh `lstat` metadata rather than trusted directory-entry type hints;
- symlinks and unsupported filesystem types fail closed; only real directories recurse and only regular files are admitted;
- every repository-relative build-input path is canonical forward-slash form, **well-formed Unicode**, already **NFC-normalized**, free of control text, and capped at **1,024 UTF-8 bytes**;
- empty, absolute, NUL/control-bearing, backslash, dot/dot-dot, escaping, malformed-Unicode, decomposed-normalization, and other normalization-alias path forms fail closed;
- each traversed directory is bound to its pre-traversal filesystem identity and size/time snapshot, recursive directory entry metadata must still match when traversal begins, and post-traversal metadata must remain unchanged;
- fixed build inputs and recursively discovered build inputs use the same canonical path admission before hashing;
- recursive roots and fixed build members are immutable, bounded, canonical, unique, and non-overlapping; recursive roots are single path segments and fixed files cannot duplicate content beneath them;
- discovered plus fixed build inputs may contain at most **100,000 descriptors**, and duplicate canonical paths fail before any file hashing begins;
- before each input is hashed, the repository root and every parent directory are snapshotted as real non-symlink directories under a **64-directory ancestry ceiling**;
- after each hash, the frozen ancestry snapshot is structurally revalidated and each parent directory must retain its size/time and available device/inode identity before descriptor admission;
- build-info creation binds bounded `package.json` reading and later input collection to the same real repository-root identity snapshot, revalidating it between phases;
- validated build-info descriptor arrays are exact dense data arrays with no holes or extra fields, are capped at **100,000 descriptors**, and reject duplicate canonical paths;
- every build-info descriptor is capped at **16 MiB**, and the validated descriptor set is independently capped at **256 MiB aggregate bytes**, matching the real source-hash boundaries;
- descriptor density checks use bounded own-key snapshotting with one key `Set`, avoiding repeated quadratic membership scans at the maximum descriptor count;
- the bounded strict-UTF-8 `package.json` reader revalidates opened-handle and pathname identity/size/time after reading before package metadata is parsed;
- build-info package name/version uses the same release identity grammar as packaging and release verification: ASCII `[A-Za-z0-9._@+-]+`, name at most **128 characters**, version at most **64 characters**;
- canonical sorted fingerprint descriptor JSON is hashed incrementally as the exact ordinary `JSON.stringify` byte stream and is capped at **8 MiB UTF-8 bytes**, avoiding one whole-array JSON Buffer allocation;
- `tools/release-package-identity.mjs`, `tools/build-input-ancestry.mjs`, and the descriptor/discovery helpers are themselves fingerprinted build semantic inputs, so changes to those identity rules change the source fingerprint.

## Browser-evidence separation

A successful hash, source fingerprint, build-input audit, build/release audit, generated package, source tree comparison, descriptor validation, package identity check, ancestry check, or filesystem identity check does not establish extension runtime behavior. Continue with the exact candidate packages and the normal Issue #10 Chromium + Firefox observation workflow.

Any source commit, source-fingerprint change, build-input membership change, byte/path/descriptor/fingerprint ceiling change, root-request/repository-root/ancestry rule change, ordering/discovery/type/identity rule change, generated-member change, package identity/hash change, or other candidate-boundary change invalidates prior exact-head observations. Re-run qualification for the new exact head rather than carrying prior observations forward.

## Privacy boundary

Build-input qualification must not retain telemetry, analytics, browsing/request history, page/DOM snapshots, action outcomes, accessibility names, consent data, locale/language profiles, statistics, timestamps, user/device identifiers, credentials, or owned Drop Ads backend state. Only local source bytes, repository-relative paths, hashes, package identity text, and filesystem metadata required for the build fingerprint may be inspected transiently.
