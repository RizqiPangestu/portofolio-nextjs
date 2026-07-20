# React Hooks: `useState`, `useRef`, `useEffect`, `useCallback`, `useMemo`

A practical guide to five of the most commonly used React hooks. Each section
explains **what it is**, **when to use it**, **the mental model**, and a
**self-contained example**.

> **What is a hook?** A function starting with `use…` that lets a component
> "hook into" React features (state, lifecycle, refs, memoization). Two rules:
> 1. Only call hooks at the **top level** of a component or another hook — never
>    inside loops, conditions, or nested functions.
> 2. Only call them from **React function components** or **custom hooks**.

---

## `useState` — reactive state

State is data that, when it changes, makes the component **re-render** so the UI
reflects the new value.

```ts
const [value, setValue] = useState(initialValue);
```

- `value` — the current value for this render.
- `setValue` — updates it and schedules a re-render.
- `initialValue` — used only on the **first** render. For expensive initial
  values, pass a function: `useState(() => makeInitial())` (lazy init).

### Key ideas

- **Changing state triggers a re-render.** This is the whole point — it's how the
  screen stays in sync with your data.
- **Updates are asynchronous.** After calling `setValue(x)`, the `value` variable
  in the current function does **not** change immediately; you'll see the new
  value on the next render.
- **Use the updater form when the next value depends on the previous one:**

```ts
setCount((prev) => prev + 1); // safe for rapid / batched updates
```

- **State is immutable — replace, don't mutate.** Create a new object/array
  instead of editing the existing one, or React may not detect the change.

### Example

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((prev) => prev + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

Immutable update of an array in state:

```tsx
// ✅ new array — React detects the change
setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));

// ❌ mutating in place — React sees the "same" array and may skip re-rendering
todos[0].done = true;
setTodos(todos);
```

**Use `useState` when:** the value affects what the user sees and the UI must
update when it changes (lists, form fields, loading/error flags, toggles).

---

## `useRef` — a mutable box that survives renders (without re-rendering)

A ref is a stable container whose `.current` you can read and write freely.
Changing `.current` does **not** trigger a re-render.

```ts
const ref = useRef(initialValue);
ref.current; // read
ref.current = next; // write — no re-render
```

### Two common uses

1. **Hold a DOM node:**

```tsx
function TextField() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  );
}
```

2. **Hold mutable data that should persist but not cause re-renders** — timers,
   previous values, caches, flags:

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  return (
    <div>
      <p>{seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

### `useState` vs `useRef`

| Question                                  | `useState` | `useRef` |
| ----------------------------------------- | ---------- | -------- |
| Does changing it re-render the UI?        | Yes        | No       |
| Does the value survive re-renders?        | Yes        | Yes      |
| Should the UI display it?                 | Usually    | Usually not |
| Good for timers / IDs / "latest" tracking | No         | Yes      |

**Use `useRef` when:** you need a value to stick around between renders but it
shouldn't drive the UI — DOM nodes, timer handles, the "latest" copy of
something, or flags read inside callbacks.

---

## `useEffect` — run side effects after render

An **effect** is code that reaches outside the render (network requests, timers,
subscriptions, manual DOM work). `useEffect` runs it **after** React has painted.

```ts
useEffect(() => {
  // effect runs after render
  return () => {
    // optional cleanup — runs before the next effect and on unmount
  };
}, [dependencies]);
```

### The dependency array controls *when* it runs

| Dependencies | Runs…                                          |
| ------------ | ---------------------------------------------- |
| `[]`         | once, after the first render (mount)           |
| `[a, b]`     | after mount, then whenever `a` or `b` changes  |
| *omitted*    | after **every** render (rarely what you want)  |

### Cleanup

If your effect starts something ongoing (timer, subscription, listener), return a
function that stops it. React runs this cleanup before re-running the effect and
when the component unmounts — this prevents leaks and stale work.

### Example — fetch data on mount

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data);
      });

    // Cleanup: ignore a late response if userId changed or we unmounted.
    return () => {
      cancelled = true;
    };
  }, [userId]); // re-run whenever userId changes

  return <p>{user ? user.name : "Loading…"}</p>;
}
```

### Example — subscribe and clean up

```tsx
function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <p>{width}px</p>;
}
```

**Use `useEffect` when:** you need to synchronize with something *outside* React —
fetching data, setting up timers/listeners, or cleaning those up. Don't use it to
compute values you can derive during render (see `useMemo`).

> **Gotcha:** anything from component scope that your effect uses (props, state,
> functions) should be in the dependency array. An empty `[]` means "capture the
> first render's values" — fine for one-time setup, but be intentional about it.

---

## `useCallback` — a stable function identity

Every render recreates the functions defined inside a component as **new** objects.
`useCallback` returns the **same** function instance across renders as long as its
dependencies don't change.

```ts
const fn = useCallback(() => {
  // ...
}, [dependencies]);
```

### Why identity matters

A new function each render is usually harmless — except when that function is:

- a **dependency** of `useEffect` / `useMemo` / another `useCallback`, or
- passed to a **memoized child** (`React.memo`) or a hook that stores it.

In those cases a fresh identity every render defeats memoization or retriggers
effects. `useCallback` keeps the identity stable so those optimizations hold.

> `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.
> Don't sprinkle it everywhere — reach for it only when a function's identity is
> actually observed by something.

### Example — passing a callback to a memoized child

```tsx
const Child = React.memo(function Child({ onClick }: { onClick: () => void }) {
  console.log("Child rendered");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // Without useCallback, `handleClick` would be a new function every render,
  // causing the memoized Child to re-render each time Parent re-renders.
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment parent</button>
      <Child onClick={handleClick} />
    </div>
  );
}
```

**Use `useCallback` when:** a function is passed to a memoized component or used
in another hook's dependency array and you need its identity to stay constant.

---

## `useMemo` — cache an expensive computed value

`useMemo` remembers the **result** of a calculation and only recomputes it when
its dependencies change. Between those changes it returns the cached value.

```ts
const result = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

- The function runs during render (unlike `useEffect`, which runs after).
- With the same dependencies, the previous result is reused — no recomputation.

### When it helps

1. **Skip expensive recalculations** on unrelated re-renders (sorting/filtering a
   large list, heavy math).
2. **Preserve object/array identity** so memoized children or hook dependencies
   don't see a "new" value every render.

### Example — avoid re-sorting on every keystroke

```tsx
function ProductList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  // Sorting only re-runs when `products` changes — not when unrelated state
  // (or a parent re-render) happens.
  const sorted = useMemo(() => {
    return [...products].sort((a, b) => a.price - b.price);
  }, [products]);

  // Filtering re-runs only when the sorted list or the query changes.
  const visible = useMemo(() => {
    return sorted.filter((p) => p.name.includes(query));
  }, [sorted, query]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {visible.map((p) => (
          <li key={p.id}>{p.name} — ${p.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example — stable object identity for a memoized child

```tsx
function Dashboard({ theme }: { theme: string }) {
  // Without useMemo, `config` is a new object every render, so a memoized
  // consumer would re-render even when `theme` didn't change.
  const config = useMemo(() => ({ theme, layout: "grid" }), [theme]);

  return <MemoizedChild config={config} />;
}
```

### `useMemo` vs `useCallback`

- `useMemo(fn, deps)` caches the **value returned** by `fn`.
- `useCallback(fn, deps)` caches the **function `fn` itself**.

> Don't overuse `useMemo`. For cheap calculations the memoization bookkeeping can
> cost more than it saves — reach for it when a computation is genuinely
> expensive or when you specifically need a stable reference.

---

## Quick decision guide

| I want to…                                                   | Use          |
| ------------------------------------------------------------ | ------------ |
| Store data that updates the UI when it changes               | `useState`   |
| Keep a value between renders without re-rendering            | `useRef`     |
| Reference a DOM element                                      | `useRef`     |
| Fetch data / set up a timer or subscription (+ clean it up)  | `useEffect`  |
| Keep a function's identity stable across renders             | `useCallback`|
| Cache an expensive computed value or keep a stable reference | `useMemo`    |

---

## Render vs. after-render, at a glance

- **Runs during render (return a value):** `useState`, `useMemo`, `useCallback`.
- **Runs after render (side effects):** `useEffect`.
- **Escape hatch, no render involvement:** `useRef`.
