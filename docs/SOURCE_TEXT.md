# Cross-platform source text determinism

Drop Ads is built and qualified on Windows and Linux. Release-relevant text must therefore have the same bytes regardless of checkout platform.

The repository `.gitattributes` enforces LF checkout semantics. `npm run source-text-audit` independently verifies release-relevant text under `src`, `lists`, `manifests`, and `tools`, plus package metadata and `.gitattributes` itself.

The audit rejects:

- malformed UTF-8 (fatal decoding)
- UTF-8 BOM
- CR or CRLF line endings
- NUL bytes
- non-empty text files without a final LF

The audit runs during `npm run check` and at the start of a direct `npm run build`, so packaging cannot silently normalize a bad checkout after qualification. `.gitattributes` is also part of deterministic build inputs, making changes to checkout semantics change the source fingerprint.

Binary image/archive extensions are marked non-text in `.gitattributes`; the strict text audit is intentionally scoped to release-relevant text roots rather than arbitrary generated binaries.
