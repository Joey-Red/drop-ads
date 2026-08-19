# Network rule value bounds

Drop Ads applies one canonical string-work ceiling to every network-rule path, not just the Settings/popup message layer.

`MAX_NETWORK_RULE_VALUE_CHARS` is **16,384 characters**. The bound is enforced by the shared core normalizers before URL parsing or pattern processing, so it applies automatically to:

- personal rules from Settings or the popup
- explicit/right-click context-menu targets
- direct background/controller mutations
- settings backup import
- persisted-state migration/revalidation
- shared/remote list normalization
- cached-policy revalidation
- optional community-candidate validation

Domain rules retain their stricter canonical DNS hostname ceiling of 253 characters. A domain normalizer may accept an HTTP(S) URL as input in order to extract its hostname, but the raw URL input still has to fit the 16,384-character network-rule ceiling before `URL` parsing.

Exact HTTP(S) rules are checked twice: the trimmed raw input must fit before parsing, and the canonical URL after fragment removal/URL percent-encoding must also fit. Unicode input therefore cannot use canonical expansion to create a much larger stored/DNR filter than the admitted input model.

Pattern rules use the same 16,384-character limit and remain ASCII-only. Values are rejected when over the ceiling; Drop Ads never truncates a rule into different semantics.

The internal runtime-message contract imports this core ceiling rather than defining a separate value limit. Its removal-key allowance adds bounded serialization overhead so a rule accepted at the exact maximum remains removable through the UI.

This is a parsing/storage/DNR reliability boundary. It does not collect request data, browsing history, or telemetry.
