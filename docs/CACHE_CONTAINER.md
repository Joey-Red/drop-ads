# Raw list-cache container boundary

The persisted list cache is admitted as a bounded plain data record before any source entry is decoded or merged into policy.

The top-level cache may be an ordinary object or a null-prototype object. It may contain at most 256 own string entries. Every entry must be an enumerable data property. Symbol keys, custom prototypes, hidden non-enumerable entries, and accessors are rejected; getters are inspected by descriptor and are never invoked by the admission check.

This admission step runs before UTF-8 JSON byte accounting and before cache-entry normalization, so hidden properties cannot evade the raw work bound. Existing cache integrity, source-binding, item-count, and 8,000,000-byte persisted-cache limits remain separate downstream gates.
