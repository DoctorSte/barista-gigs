"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useDict } from "@/components/i18n-provider";

// The site only sets cookies that keep you signed in (plus your language);
// analytics are cookieless. So this is an honest one-liner, not a consent
// wall — acknowledged once, remembered in localStorage.

const KEY = "cookie-notice-ack";
let listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function acknowledged() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function CookieNotice() {
  const d = useDict();
  // Server snapshot says "acknowledged" so nothing flashes during SSR; the
  // banner appears after hydration for first-time visitors only.
  const acked = useSyncExternalStore(subscribe, acknowledged, () => true);
  if (acked) return null;

  return (
    <div
      role="status"
      className="bubble-in fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-surface-raised py-2.5 pl-4 pr-2.5 shadow-lg shadow-black/10"
    >
      <p className="flex-1 text-[13px] leading-snug text-muted-foreground">
        {d.cookies.notice}{" "}
        <Link
          href="/legal/privacy"
          className="whitespace-nowrap underline underline-offset-2 hover:text-foreground"
        >
          {d.cookies.more}
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            // Storage unavailable — the banner just returns next visit.
          }
          listeners.forEach((l) => l());
        }}
        className="pressable shrink-0 rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground"
      >
        {d.cookies.ok}
      </button>
    </div>
  );
}
