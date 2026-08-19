# Explicit context-block cleanup

The right-click **Block ad/resource locally** flow has two separate responsibilities: commit durable browser network policy, then improve the current page when the exact clicked resource can be removed safely. DOM cleanup must never be used as evidence that the network transaction succeeded.

## Commit-before-cleanup invariant

The background waits until committed personal-block state proves the selected network rule exists. Only then does it send the captured target URL back to the originating tab/frame. A failed new policy transaction leaves the page untouched. A block that was already committed may clean the current explicit target without requiring a redundant storage write.

## Live-target revalidation

Pages can mutate while policy is being committed. Rotating ads may reuse one `<img>` node, responsive images can change `currentSrc`, frames can navigate, and links can change `href`. Therefore Drop Ads validates all of the following immediately before cleanup:

- the in-memory target has not exceeded its 10-second lifetime
- the exact element is still connected
- the committed target URL equals the URL captured at context-menu time
- the element's **current live** `currentSrc` / `src` / `data` / `href` still equals that captured URL

If any check fails, cleanup does nothing and the normal refresh-needed fallback remains available. Surviving DOM-node identity is not sufficient: replacement content is never removed merely because a page reused the same element.

## Privacy and accessibility

The target reference and captured URL exist only in that content script's memory and are discarded after use/expiry. There is no click history, selector history, DOM snapshot, page-text capture, request-history persistence, or telemetry. Media is paused before removal when possible, focused targets are blurred before replacement, and placeholders are noninteractive/presentation-only.
