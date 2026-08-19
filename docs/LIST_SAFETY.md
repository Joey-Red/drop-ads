# Remote list safety envelope

Remote filter text is hostile input. Drop Ads does not treat a successful HTTPS response as permission to consume arbitrary time, CPU, memory, syntax, or browser-rule budget.

The current admission envelope is fail-closed and layered:

- HTTPS only; URL credentials rejected
- redirects rejected
- credentials omitted and referrer suppressed
- each list download/parse operation has a **30 second deadline**; timeout aborts the fetch best-effort and the caller fails even if an implementation ignores `AbortSignal`
- explicit HTML/XHTML/JSON/XML media types rejected
- obvious mislabeled HTML/XML payloads rejected
- streamed decoded payload capped at **5,000,000 bytes**
- streamed bodies must be valid **UTF-8**; malformed or truncated byte sequences are rejected instead of being converted to replacement characters
- logical line count capped at **300,000 lines**
- any individual logical line longer than **16,384 characters** is rejected
- total supported network + declarative cosmetic output capped at **300,000 rules** before cache activation
- local/private/LAN remote targets rejected
- unsupported syntax is ignored only within the conservative parser contract; a response with zero supported rules is rejected
- DNR budget is preflighted before activation
- the previous last-known-good cache remains active when a new download fails validation

These limits are rejection limits, not truncation limits. Silently activating the first N rules of an oversized, malformed, timed-out, or pathological source could materially change policy while pretending an update succeeded.

## Download deadline

The deadline covers the remote GET, streamed body consumption, validation, and parser admission call rather than stopping once response headers arrive. A real browser fetch receives an `AbortSignal`; the stream reader is also canceled best-effort when that signal fires. The operation is raced against the deadline so a mock/implementation that ignores abort cannot indefinitely hold Drop Ads' serialized refresh/policy queue. Parsed results from an operation that already timed out are ignored and cannot proceed into cache/DNR activation.

## Encoding

Normal browser fetch responses are consumed from their byte stream with `TextDecoder("utf-8", { fatal: true })`. Valid multibyte characters may cross network chunk boundaries and are preserved. Invalid byte sequences and a final incomplete multibyte code point fail the entire candidate update.

A narrow already-decoded `response.text()` fallback remains for WebExtension/test environments that do not expose a readable byte stream; production browser fetch responses are expected to take the strict streaming path. Drop Ads does not attempt encoding sniffing or silently reinterpret upstream bytes as a legacy character set.

## Work and activation bounds

The download deadline bounds wall-clock waiting. The transport byte ceiling is the first memory boundary. UTF-8 validation occurs while the bounded stream is decoded. The line/line-length gates run immediately after decoding and before network/cosmetic parsers allocate rule collections. The supported-output cap is a second guard before any parsed result can enter transactional cache/DNR activation.

Reviewed built-ins must continue to fit this envelope. `npm run qualify:sources` is the live-upstream diagnostic for current source counts/overlap; native-browser DNR/memory/breakage observations remain in Issue #10.
