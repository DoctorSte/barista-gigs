"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "bg-coords";

export type Coords = { lat: number; lng: number };

// localStorage as an external store: useSyncExternalStore keeps the server
// snapshot (null) for hydration and swaps in the cached position right after,
// so the distance filter survives navigation without a hydration mismatch.
const listeners = new Set<() => void>();
let snapshot: string | null = null;
let hydrated = false;

function readSnapshot(): string | null {
  if (!hydrated) {
    hydrated = true;
    try {
      snapshot = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      snapshot = null;
    }
  }
  return snapshot;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function writeSnapshot(value: string) {
  snapshot = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Non-fatal: the position still works for this session.
  }
  for (const listener of listeners) listener();
}

/** The viewer's coordinates, requested only on an explicit click. */
export function useGeolocation() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied">("idle");

  const coords = useMemo<Coords | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Coords;
      return typeof parsed?.lat === "number" && typeof parsed?.lng === "number" ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("idle");
        writeSnapshot(
          JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
        );
      },
      () => setStatus("denied"),
      { maximumAge: 5 * 60 * 1000, timeout: 10_000 },
    );
  }, []);

  return { coords, status, locate };
}
