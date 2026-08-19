# Element picker bounds

Drop Ads generates local cosmetic selectors only after an explicit **Pick element to block** action. Selector generation and the temporary picker session are deliberately bounded so an unusual page structure or abandoned interaction cannot turn one picker action into unbounded DOM work or a permanent page listener.

Current selector bounds:

- maximum generated selector length: **400 characters**
- maximum ancestor depth inspected: **5 levels**
- maximum siblings inspected for one `:nth-of-type()` decision: **10,000 elements**
- stable token length: **80 characters**
- at most three stable classes are included in one compact selector part

Sibling inspection iterates the live collection without materializing/copy-filtering the entire child list. If the 10,000-element scan ceiling is exceeded, selector generation stops with a user-visible failure and asks the user to choose a more specific element; it never silently selects a broader target.

CSS escaping iterates Unicode code points, so astral identifiers are escaped once as their actual code point rather than as separate UTF-16 surrogate halves. Leading digits, punctuation, and whitespace are escaped deterministically.

## Picker session lifetime

One picker overlay/listener session may remain active for at most **2 minutes**. Starting a session arms one generation-safe timer. Save, Cancel, Escape, page lifecycle exit, or timeout all route through the same idempotent cleanup function, which removes capture listeners, resize/scroll listeners, the shadow-root host, and the timer.

Starting the picker while one is already active does not create another overlay/listener/timer. A stale timer callback from a prior session cannot clear a newer session. Timeout never saves a selector or rule.

The picker does not use `textContent`, `innerText`, `innerHTML`, or `outerHTML` as selector input and does not persist a history of inspected/clicked page elements.
