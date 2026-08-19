# Generated verification result qualification

This guide covers the source/result boundary through M1332. It is supporting evidence for exact-head Chromium and Firefox qualification; **Issue #10 remains the authoritative browser-observation gate**. The source-only preflight described here never substitutes for browser evidence.

## Source-only preflight

Run the repository's normal preflight plus the focused composite audit:

```sh
npm ci
npm run qualify:preflight
node tools/generated-verification-preflight-audit.mjs
node tools/generated-verification-audit-preflight-hardening-audit.mjs
node tools/generated-verification-qualification-guidance-audit.mjs
node tools/generated-verification-privacy-surface-audit.mjs
```

Passing source audits is not a Chromium or Firefox qualification result. Keep this evidence bound to the exact commit being qualified; discard it if the source head changes before browser observation.

The M1243–M1252 source-only chain additionally requires:

- the qualification guide itself to remain bounded and refuse explicit browser-success claims;
- reviewed generated-verification sources to remain free of executable network, browser-storage, navigator, DOM/window, and persistence surfaces;
- audit source reads to stay root-confined, regular-file-only, non-symlink, strict UTF-8, byte-bounded, and identity-stable;
- guide/source membership and byte ceilings to come from one immutable audit contract rather than per-audit copies;
- qualification-guidance and privacy-surface checks to execute through the composite generated-verification preflight and generated-release integration gate;
- the composite preflight result to remain an exact frozen result shape with bounded control-free child marker text while preserving historical M1240/M1249 marker compatibility.

The M1253–M1262 hardening chain additionally requires:

- the repository root and every audited source parent directory to be real non-symlink directories with bounded ancestry and post-read identity revalidation;
- audit paths to be canonical repository-relative forward-slash text capped at 1,024 UTF-8 bytes, well-formed NFC Unicode, and free of control/invisible/bidi text;
- the audit contract itself to validate canonical paths, byte ceilings, immutable inventory shape, and duplicate-path refusal before audits consume it;
- preflight-result candidate markers to be snapshotted from an exact plain own-data object without getter execution;
- child preflight markers to be at most 512 UTF-8 bytes, well-formed NFC Unicode, and free of C0/C1, zero-width, BOM, and bidi controls;
- opened audit-source reads to use a `maxBytes + 1` bounded buffer rather than whole-file `handle.readFile()`, so source growth cannot cause unbounded allocation before rejection;
- the privacy review to include the shared audit I/O/contract/guidance/preflight support stack while avoiding self-scanning the privacy matcher's own pattern literals;
- `generated-verification-audit-preflight-hardening-audit.mjs` to validate the M1253–M1260 source markers and regression chain before the existing composite preflight checks continue.

The M1263–M1272 hardening chain additionally requires:

- audit contract entries to be exact frozen plain own-data `{ path, maxBytes }` objects, with malformed/accessor-backed/extra/symbolic entries rejected before values are consumed;
- audit inventories to be dense exact arrays capped at 64 entries and snapshotted by indexed descriptors without iterator execution;
- validated audit inventory publication to use deterministic direct code-unit path ordering independent of caller order or host locale;
- opened audit reads to revalidate the final pathname after reading, and filesystem identity to include device, inode, mode, hard-link count, size, mtime, and ctime across source/root/ancestry checks;
- privacy-surface diagnostics to retain at most 128 violations, with the next attempted finding failing immediately;
- privacy audit success to prove complete canonical source-contract coverage in exact order under the aggregate byte ceiling and return a copied frozen file inventory;
- composite preflight child markers to be consumed from own data descriptors and normalized through the same bounded well-formed NFC/control-free marker contract;
- the M1261 audit/preflight hardening child result to be consumed as an exact canonical gate while remaining intentionally absent from the historical published preflight result shape;
- the M1263–M1272 closeout audit/documentation chain to remain source-only and never be interpreted as browser observations.

The M1273–M1282 hardening chain additionally requires:

- generated-verification hardening source/regression reads to use shared bounded identity-safe audit I/O with 256 KiB and 128 KiB ceilings instead of direct whole-file reads;
- generated-verification result-contract source/regression reads to use the same shared bounded audit I/O with explicit 256 KiB and 128 KiB ceilings;
- result-contract diagnostics to retain at most 64 violations and qualification-guidance diagnostics at most 32 violations, each through one bounded recorder;
- audit/preflight-hardening diagnostics to retain at most 128 violations across required source-marker and regression checks;
- result-contract audit success to be an exact frozen own-data `{ marker }` object preserving the historical M1238-M1239 marker;
- qualification-guidance audit success to be an exact frozen `{ guide, marker }` object bound to the canonical guide path and historical M1243 marker;
- audit/preflight-hardening success to be an exact frozen own-data `{ marker }` object preserving the historical M1261 integration marker;
- composite preflight child results to be frozen plain objects before their own data `marker` descriptors are consumed; mutable, custom-prototype, and accessor-backed child evidence fails closed without getter execution;
- the legacy generated-verification hardening result to be frozen without changing its historical published marker/key shape;
- the M1273–M1282 closeout chain to remain source-only supporting evidence and never be interpreted as browser observations.

The M1283–M1292 preflight-integrity chain additionally requires:

- generated-verification hardening diagnostics to retain at most 128 findings through one bounded recorder, and hardening success to publish only through the exact frozen historical ten-marker contract;
- every composite child audit result to match its reviewed exact frozen key set before marker consumption, and every consumed child marker to equal its explicit historical canonical value;
- privacy-surface matcher rules to be immutable validated `{ pattern, label }` contracts with bounded well-formed NFC/control-free labels;
- privacy matchers to be exact native RegExp instances with zero `lastIndex`, no global/sticky state, and at most 512 UTF-8 bytes of matcher source;
- successful audit-source reads to publish exact frozen `{ path, source, bytes }` snapshots whose canonical path is revalidated and whose strict-decoded UTF-8 byte length matches the bounded read count exactly;
- filesystem identity to be projected from own data descriptors into frozen dev/inode/mode/link-count/size/mtime/ctime tuples rather than retaining live Node `Stats` objects;
- root, ancestry, initial/final pathname, and opened-handle revalidation to compare only those reviewed immutable identity tuples;
- the bounded audit/preflight-hardening gate to require the complete M1283–M1290 source/regression chain while preserving the historical M1261 composite result marker;
- the M1291 source-only integration marker and M1292 closeout documentation to remain supporting evidence only and never be interpreted as browser observations.

The M1293–M1302 privacy/preflight-integrity chain additionally requires:

- privacy matcher inventories to be dense exact descriptor-snapshotted arrays capped at 32 entries, with every entry revalidated as an exact frozen `{ pattern, label }` rule without iterator execution;
- the complete privacy source-result inventory to be a dense exact frozen contract-order array of exact own-data `{ path, source, bytes }` snapshots before published file evidence is derived;
- admitted privacy RegExp objects to expose only the native zero-valued `lastIndex` own property, with own method/property/symbol shadowing rejected, and matching to execute through a captured `RegExp.prototype.test` intrinsic;
- direct preflight result construction to bind all four child markers to their exact historical canonical values rather than accepting arbitrary bounded marker text;
- direct/composed preflight success to pass through `freezeGeneratedVerificationPreflightInput`, an exact frozen own-data four-marker input contract, while the historical descriptor-safe null-prototype snapshot helper remains compatible;
- the published preflight success surface to remain the exact frozen seven-field contract, with M1240/M1249/M1251 result markers centralized in one immutable marker contract;
- audit path snapshots to contain an exact frozen canonical repository-relative path plus a dense descriptor-snapshotted segment array that reconstructs the path exactly under the existing 64-directory ancestry ceiling;
- audit source path resolution and ancestry construction to consume validated segments by indexed access instead of external segment iteration;
- audit ancestry entries to be exact frozen own-data `{ path, state }` objects with absolute normalized paths and reviewed frozen filesystem identity tuples, descriptor-snapshotted again before revalidation;
- the M1301 bounded integration gate and M1302 closeout chain to remain source-only supporting evidence and never be interpreted as browser observations.

The M1303–M1312 audit-identity/limits chain additionally requires:

- published filesystem identity tuples to be exact frozen plain seven-field results and to be descriptor-resnapshotted before every stability comparison;
- source ancestry to be a dense exact frozen descriptor-snapshotted inventory capped at 64 entries, with holes, extra/symbolic fields, accessors, malformed entries, and iterator-dependent shapes rejected;
- repository-root evidence to be an exact frozen own-data `{ path, state }` result whose absolute normalized path and reviewed identity tuple are revalidated at both ends of a bounded read;
- `GENERATED_VERIFICATION_AUDIT_LIMITS` to remain the single immutable authority for 1,024 path bytes, 1 MiB source bytes, 64 ancestry entries, 64 audit-contract entries, and 32 privacy matcher rules;
- audit I/O and audit-contract admission to derive their path/source/ancestry/cardinality ceilings from that shared limits contract and use the shared source-byte-ceiling validator;
- successful bounded source reads to be descriptor-resnapshotted as exact frozen own-data `{ path, source, bytes }` results before qualification-guidance, privacy-surface, hardening, result-contract, or audit/preflight-hardening code consumes their evidence;
- privacy source-result inventory validation to reuse the same shared source-result resnapshot contract rather than a duplicate local schema;
- privacy matcher cardinality to derive from `GENERATED_VERIFICATION_AUDIT_LIMITS.maxPrivacyRules` while exact-native/stateless/captured-intrinsic matcher semantics stay unchanged;
- the M1311 bounded integration gate and M1312 closeout chain to remain source-only supporting evidence and never be interpreted as browser observations.

The M1313–M1322 privacy/diagnostic chain additionally requires:

- reviewed generated-verification support sources to fail closed if they expose Node networking modules (`node:http`, `node:https`, `node:http2`, `node:net`, `node:tls`, `node:dns`, `node:dgram`) or process/worker modules (`node:child_process`, `node:worker_threads`, `node:cluster`);
- reviewed support sources to fail closed on filesystem mutation primitives while the canonical bounded audit I/O remains read-only;
- privacy matcher labels and RegExp sources to derive their 96-byte and 512-byte ceilings from `GENERATED_VERIFICATION_AUDIT_LIMITS`;
- privacy aggregate source bytes and retained diagnostics to derive their 640 KiB and 128-finding ceilings from the same immutable limits authority;
- qualification-guidance, result-contract, legacy hardening, and audit/preflight-hardening diagnostic ceilings to be represented by shared canonical limits of 32, 64, 128, and 128 respectively;
- qualification-guidance, result-contract, and legacy hardening recorders to consume those shared diagnostic limits directly, with audit/preflight-hardening doing the same at M1321 integration;
- privacy success evidence to publish through `tools/generated-verification-privacy-result.mjs` as an exact frozen own-data `{ files, aggregateBytes, marker }` result preserving the historical M1244 marker;
- privacy result file evidence to be a dense descriptor-snapshotted frozen array matching the complete reviewed privacy source contract in exact deterministic order;
- the privacy-result support module itself to be included in the reviewed privacy source inventory while the privacy matcher implementation remains excluded from self-scanning its own forbidden literals;
- live privacy-audit success to prove complete source-result coverage, construct the exact privacy result, and descriptor-safe resnapshot it before publication;
- the M1321 bounded integration gate and M1322 closeout chain to remain source-only supporting evidence and never be interpreted as browser observations.

The M1323–M1332 read/privacy hardening chain additionally requires:

- hardening and result-contract source/regression reads to derive their 256 KiB/128 KiB ceilings from `GENERATED_VERIFICATION_AUDIT_LIMITS` rather than independent numeric authorities;
- qualification guidance, reviewed privacy sources, and audit/preflight-hardening reads to derive their 32 KiB, 192 KiB, 192 KiB, and 64 KiB source/regression ceilings from the same immutable limits authority;
- the canonical guide contract and every reviewed privacy-source contract entry to consume the shared guidance/privacy byte ceilings directly;
- reviewed generated-verification support sources to fail closed on dynamic execution surfaces including `eval`, Function construction, dynamic `import()`, `importScripts`, runtime WebAssembly compile/instantiate, and CommonJS `require()`;
- reviewed support sources to fail closed on environment and host-identity collection including `process.env`, `process.cwd()`, `node:os`, hostname, userInfo, and homedir access while benign CLI `process.argv`/`process.exitCode` use remains allowed;
- exact privacy source-result inventory validation to live in the dedicated privacy-result authority as dense descriptor-snapshotted canonical-order `{ path, source, bytes }` evidence;
- published privacy file membership and aggregate bytes to be recomputed from those exact source snapshots through `freezeGeneratedVerificationPrivacyResultFromSourceResults` rather than trusted from caller-supplied totals;
- live privacy-audit success to pass through the source-derived exact privacy-result constructor and descriptor-safe result resnapshotting, with the duplicate local source-result schema removed;
- the M1331 bounded integration gate and M1332 closeout chain to remain source-only supporting evidence and never be interpreted as browser observations.

These are repository/source properties only. They do not manufacture, import, infer, or retain browser observation state.

## Exact-head browser observations

For the exact commit being qualified, build/package the extension with the normal release pipeline and perform the existing Chromium and Firefox observation workflow. During supporting generated-output verification, confirm all of the following remain true:

1. Each browser verifier result is an exact frozen own-data object containing only `browser`, `sourceFingerprint`, and `files`.
2. `files` is frozen, deterministic, canonical, and bounded by the generated-verification contract.
3. `sourceFingerprint` is exactly 64 lowercase hexadecimal characters representing SHA-256.
4. The paired result is an exact frozen object containing only `chromium`, `firefox`, and `sourceFingerprint`.
5. Both browser child fingerprints exactly equal the paired shared fingerprint.
6. A generated-tree, source, ancestry, output, result-shape, or fingerprint mismatch fails closed rather than returning success.
7. No result/preflight path records page URLs, request history, blocked actions, DOM/accessibility text, language/consent context, user/device identifiers, analytics, or telemetry.
8. Chromium and Firefox observations belong to the same exact source head and source fingerprint; a mixed-head pair is invalid evidence.
9. Source-only qualification/privacy/audit-I/O/preflight-hardening checks and their frozen markers remain supporting evidence and are never interpreted as browser observations.

Record browser evidence only through the existing Issue #10 qualification workflow. Do not treat repository tests, audits, fixtures, generated records, or this guide as a browser pass.
