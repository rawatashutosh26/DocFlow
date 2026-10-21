"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export const ALL_COLUMNS = [
  { key: "size", label: "Size" },
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
  { key: "updatedAt", label: "Last Updated" },
] as const;

export type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const STORAGE_KEY = "dms.visibleColumns";
const DEFAULT_VISIBLE: ColumnKey[] = ["size", "version", "status", "updatedAt"];
// A single stable Set instance for defaults. useSyncExternalStore compares
// snapshots by reference, so getServerSnapshot (and the "nothing saved yet"
// fallback) must always return the exact same object, not a fresh `new
// Set(...)` each call — otherwise every render looks "changed" and loops.
const DEFAULT_VISIBLE_SET: Set<ColumnKey> = new Set(DEFAULT_VISIBLE);

// A tiny external store backed by localStorage. Using useSyncExternalStore
// (rather than useState + useEffect) means the first client render matches
// the server-rendered HTML exactly — no hydration mismatch, no lint issues
// around calling setState from inside an effect, and every mounted
// component instance stays in sync automatically.
const listeners = new Set<() => void>();
let cached: Set<ColumnKey> | null = null;

function readFromStorage(): Set<ColumnKey> {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return new Set(JSON.parse(saved) as ColumnKey[]);
    }
  } catch {
    // Ignore malformed/unavailable storage — fall back to defaults.
  }
  return DEFAULT_VISIBLE_SET;
}

function getSnapshot(): Set<ColumnKey> {
  if (!cached) cached = readFromStorage();
  return cached;
}

function getServerSnapshot(): Set<ColumnKey> {
  return DEFAULT_VISIBLE_SET;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setVisibleColumnsStore(next: Set<ColumnKey>) {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  } catch {
    // Best-effort persistence only.
  }
  listeners.forEach((l: any) => l());
}

interface ColumnPreferencesContextValue {
  visibleColumns: Set<ColumnKey>;
  isVisible: (key: ColumnKey) => boolean;
  toggleColumn: (key: ColumnKey) => void;
}

const ColumnPreferencesContext = createContext<ColumnPreferencesContextValue | null>(null);

export function ColumnPreferencesProvider({ children }: { children: ReactNode }) {
  const visibleColumns = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleColumn = (key: ColumnKey) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumnsStore(next);
  };

  return (
    <ColumnPreferencesContext.Provider
      value={{
        visibleColumns,
        isVisible: (key) => visibleColumns.has(key),
        toggleColumn,
      }}
    >
      {children}
    </ColumnPreferencesContext.Provider>
  );
}

export function useColumnPreferences() {
  const ctx = useContext(ColumnPreferencesContext);
  if (!ctx) {
    // Components rendered outside the dashboard layout (rare) get sensible
    // defaults instead of crashing.
    return {
      visibleColumns: new Set(DEFAULT_VISIBLE),
      isVisible: (key: ColumnKey) => DEFAULT_VISIBLE.includes(key),
      toggleColumn: () => {},
    };
  }
  return ctx;
}