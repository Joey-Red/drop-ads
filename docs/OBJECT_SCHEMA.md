# Descriptor-safe exact objects

Drop Ads treats canonical policy and message objects as plain data, not executable object graphs.

`assertPlainExactObject()` accepts only ordinary objects or null-prototype objects whose own fields are explicitly allowed enumerable data properties. Validation uses `Reflect.ownKeys()` and property descriptors before callers read field values.

The boundary rejects arrays, custom prototypes, symbol keys, unsupported string keys, non-enumerable properties, getters, setters, and accessor pairs. Accessors are rejected without being invoked. Unsupported string fields are sorted before reporting so the first error is deterministic.

This prevents hidden or executable object properties from being silently normalized into canonical policy. It does not collect or retain any browsing, request, page, user, or device information.
