# `useDebouncedPerKey`

A generic, reusable React hook that **debounces an async action per key**. Rapid
calls for the same key are coalesced so that only the *latest* value is flushed
once that key has been quiet for `delayMs`.

- **File:** `src/app/_hooks/useDebouncedPerKey.ts`
- **Import:** `import { useDebouncedPerKey } from "@/app/_hooks/useDebouncedPerKey";`
- **Client only:** the module is marked `"use client"` (it relies on timers and refs).

---

## Why it exists

Some UI actions fire in bursts — toggling a checkbox repeatedly, typing into a
search box, dragging a slider, editing a form field. Sending one network request
per event is wasteful and causes race conditions (an older response can overwrite
a newer one).

This hook keeps that logic in one place:

- **Per key** — each key (row id, field name, etc.) is debounced independently.
- **Coalescing** — only the most recent value for a key is ever sent.
- **Race-safe** — the action is told when a newer change arrived mid-flight so it
  can skip stale finalize / rollback work.
- **Self-cleaning** — all pending timers are cancelled on unmount.

The hook owns only the *generic* concerns (timers, "latest value" bookkeeping,
cleanup). Domain-specific behavior such as optimistic UI updates and rollback
stays in your component.

---

## API

```ts
function useDebouncedPerKey<T>(
  action: (key: string, value: T, ctx: DebouncedFlushContext) => void | Promise<void>,
  delayMs: number,
): DebouncedPerKey<T>;
```

### Parameters

| Name      | Type                                                              | Description                                                                 |
| --------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `action`  | `(key, value, ctx) => void \| Promise<void>`                     | Called once per key after it stays quiet for `delayMs`, with the latest value. |
| `delayMs` | `number`                                                         | Quiet period (in milliseconds) before a key is flushed.                     |

> The latest `action` closure is always used — you can pass a fresh inline
> function every render without re-creating the returned helpers.

### Returns — `DebouncedPerKey<T>`

| Method              | Signature                          | Description                                                              |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `schedule`          | `(key: string, value: T) => void`  | Queue (or re-queue) `value` for `key`; (re)starts the quiet timer.       |
| `isPending`         | `(key: string) => boolean`         | Whether a flush is currently scheduled (waiting) for `key`.              |
| `peek`              | `(key: string) => T \| undefined`  | The latest value queued for `key`, or `undefined` if nothing is pending. |
| `cancel`            | `(key: string) => void`            | Cancel any pending flush for `key` **without** running it.               |

### `DebouncedFlushContext`

Passed to `action` as the third argument:

| Field        | Type      | Description                                                                                                   |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------ |
| `superseded` | `boolean` | `true` if another `schedule()` for the same key happened while this flush was running. It is read live, so check it **after** any `await`. Callers should usually skip finalize / rollback when it is `true` and let the newer pending flush settle. |

---

## Lifecycle

```
schedule(key, v1) ──► [timer for key]
schedule(key, v2) ──► clears old timer, starts new one (latest = v2)
        │
        └── after delayMs of quiet ──► action(key, v2, ctx)
                                          │
                          (a new schedule while awaiting?)
                                          │
                              ctx.superseded === true ──► newer flush takes over
```

- `schedule` stores the latest value and resets the key's timer.
- When the timer fires, the timer entry and stored value are removed, then
  `action` runs with the last value.
- If `schedule` is called again while `action` is awaiting, a new timer exists,
  so `ctx.superseded` reads `true` and the in-flight `action` should bail out of
  any final state changes.
- On unmount, every pending timer is cleared automatically.

---

## Basic usage

```tsx
"use client";

import { useDebouncedPerKey } from "@/app/_hooks/useDebouncedPerKey";

function FieldAutosave() {
  const save = useDebouncedPerKey<string>(async (field, value, ctx) => {
    await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({ field, value }),
    });
    if (ctx.superseded) return; // a newer edit is already pending
    // ...mark field as saved...
  }, 400);

  return (
    <input
      onChange={(e) => save.schedule("displayName", e.target.value)}
    />
  );
}
```

---

## Real example: per-item toggle with optimistic UI + rollback

This is how `WishlistChecklist.tsx` uses the hook. The component keeps the
domain-specific bits (last confirmed value for rollback, and which items have a
request in flight); the hook handles the debounce.

```tsx
const TOGGLE_DEBOUNCE_MS = 500;

// Domain-specific bookkeeping (NOT handled by the hook).
const toggleBaseline = useRef<Map<string, boolean>>(new Map()); // for rollback
const toggleInFlight = useRef<Set<string>>(new Set());

const toggleSync = useDebouncedPerKey<boolean>(async (id, target, ctx) => {
  toggleInFlight.current.add(id);
  let failed = false;
  try {
    await updateRow(id, { isChecked: target ? "TRUE" : "FALSE" });
  } catch (e) {
    failed = true;
    setError(e instanceof Error ? e.message : "Gagal menyimpan.");
  } finally {
    toggleInFlight.current.delete(id);
  }

  // A newer burst was scheduled mid-flight → let it be the source of truth.
  if (ctx.superseded) return;

  if (failed) {
    const confirmed = toggleBaseline.current.get(id) ?? false;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isChecked: confirmed } : i)),
    );
  }
  toggleBaseline.current.delete(id);
  setTogglingIds((prev) => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
}, TOGGLE_DEBOUNCE_MS);

function toggleCheck(item: WishlistItem) {
  const id = item.id;

  // Remember the last confirmed value only at the start of a burst.
  const active = toggleSync.isPending(id) || toggleInFlight.current.has(id);
  if (!active) toggleBaseline.current.set(id, item.isChecked);

  // Flip from the latest intended value, not the (possibly stale) prop.
  const current = toggleSync.peek(id) ?? item.isChecked;
  const nextChecked = !current;

  // Optimistic UI — instant, every click.
  setItems((prev) =>
    prev.map((i) => (i.id === id ? { ...i, isChecked: nextChecked } : i)),
  );

  // Debounce the write; only the final value is sent.
  toggleSync.schedule(id, nextChecked);
}
```

### Why `peek` matters here

Between clicks the React prop (`item.isChecked`) may still hold the old value,
because state updates are async. `peek(id)` returns the latest *intended* value
that was scheduled, so consecutive rapid clicks flip correctly (`on → off → on`)
even before a re-render.

### Why `isPending` / in-flight matters here

The baseline (used for rollback) must be captured only once per burst — the last
value the server confirmed. If we overwrote it on every click, a failed save
would roll back to an already-optimistic value. Checking `isPending(id)` and the
in-flight set tells us whether we're mid-burst.

---

## Notes & gotchas

- **Read `ctx.superseded` after awaiting**, not before — it reflects state at the
  moment you read it.
- **The hook does not roll back or manage UI** — it only decides *when* and *with
  what value* to call your action. Optimistic updates and rollback are yours.
- **Keys are strings.** Use a stable identifier (row id, field name). Different
  keys never interfere with each other.
- **`peek` returns `undefined` once a key has flushed** (its stored value is
  cleared right before the action runs). Fall back to your source of truth, e.g.
  `toggleSync.peek(id) ?? item.isChecked`.
- **Client component only.** Import it from files that run on the client.
