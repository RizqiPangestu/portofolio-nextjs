"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DEFAULT_CONFIG, fetchConfig, type NiaConfig } from "../_data/config";

// Config is read only on the client, so we cache it in localStorage instead of
// a cookie: cookies are sent on every HTTP request (wasted bandwidth + a 4KB
// limit), while localStorage keeps it purely client-side with no per-request
// cost. The cache is used instantly on load; the Sheet is re-read at most once
// per TTL (stale-while-revalidate).
const STORAGE_KEY = "untuk-nia-config";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CachedConfig = { config: NiaConfig; savedAt: number };

type ConfigContextValue = {
  config: NiaConfig;
  /** True once the config has been resolved (from cache or network). */
  ready: boolean;
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

// Module-level single-flight: even if the provider remounts, all consumers
// share one in-flight network request instead of firing a new one each time.
let inFlight: Promise<NiaConfig> | null = null;

function loadConfigOnce(): Promise<NiaConfig> {
  if (!inFlight) {
    inFlight = fetchConfig()
      .then((cfg) => {
        writeCache(cfg);
        return cfg;
      })
      .catch((e) => {
        // Clear the shared promise so a later mount can retry.
        inFlight = null;
        throw e;
      });
  }
  return inFlight;
}

function readCache(): CachedConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedConfig;
    if (!parsed || typeof parsed.savedAt !== "number" || !parsed.config) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(config: NiaConfig): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedConfig = { config, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private-mode errors; we just won't cache.
  }
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<NiaConfig>(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setConfig(cached.config);
      setReady(true);
      // Fresh cache → skip the network entirely.
      if (Date.now() - cached.savedAt < CACHE_TTL_MS) return;
    }

    loadConfigOnce()
      .then((cfg) => {
        if (!cancelled) {
          setConfig(cfg);
          setReady(true);
        }
      })
      .catch(() => {
        // Keep defaults / stale cache; still mark ready so consumers proceed.
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, ready }}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Read the shared `NiaConfig`. Falls back to `DEFAULT_CONFIG` (already resolved)
 * if used outside a `ConfigProvider`, so components stay usable standalone.
 */
export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) return { config: DEFAULT_CONFIG, ready: true };
  return ctx;
}
