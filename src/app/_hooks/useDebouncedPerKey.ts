"use client";

import { useCallback, useEffect, useRef } from "react";

export type DebouncedFlushContext = {
  /**
   * `true` if another `schedule()` for the same key happened while this flush
   * was running. Callers should usually skip "finalize"/rollback work in that
   * case and let the newer, pending flush settle instead.
   */
  readonly superseded: boolean;
};

export type DebouncedPerKey<T> = {
  /** Queue (or re-queue) `value` for `key`; flushes after it stays quiet. */
  schedule: (key: string, value: T) => void;
  /** Whether a flush is currently scheduled (waiting) for `key`. */
  isPending: (key: string) => boolean;
  /** The latest value queued for `key`, or `undefined` if none is pending. */
  peek: (key: string) => T | undefined;
  /** Cancel any pending flush for `key` without running it. */
  cancel: (key: string) => void;
};


export function useDebouncedPerKey<T>(
  action: (
    key: string,
    value: T,
    ctx: DebouncedFlushContext,
  ) => void | Promise<void>,
  delayMs: number,
): DebouncedPerKey<T> {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const latest = useRef(new Map<string, T>());
  // Keep the newest action closure without re-creating `schedule`.
  const actionRef = useRef(action);
  actionRef.current = action;

  // Cancel every pending timer when the component unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const flush = useCallback(async (key: string) => {
    timers.current.delete(key);
    if (!latest.current.has(key)) return;
    const value = latest.current.get(key) as T;
    latest.current.delete(key);
    await actionRef.current(key, value, {
      get superseded() {
        // A new flush was scheduled for this key while we were running.
        return timers.current.has(key);
      },
    });
  }, []);

  const schedule = useCallback(
    (key: string, value: T) => {
      latest.current.set(key, value);
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      timers.current.set(
        key,
        setTimeout(() => void flush(key), delayMs),
      );
    },
    [delayMs, flush],
  );

  const isPending = useCallback((key: string) => timers.current.has(key), []);

  const peek = useCallback(
    (key: string): T | undefined => latest.current.get(key),
    [],
  );

  const cancel = useCallback((key: string) => {
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.delete(key);
    latest.current.delete(key);
  }, []);

  return { schedule, isPending, peek, cancel };
}
