"use client";

// PostHog product analytics + error tracking. No-op until
// NEXT_PUBLIC_POSTHOG_KEY is set, so dev without a key stays silent.

import { useEffect } from "react";
import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function AnalyticsProvider({
  userId,
  role,
}: {
  userId: string | null;
  role: "shop" | "extra" | null;
}) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: "https://us.i.posthog.com",
      defaults: "2025-05-24", // SPA pageview + pageleave capture
      capture_exceptions: true,
    });
  }, []);

  useEffect(() => {
    if (!KEY) return;
    if (userId) {
      posthog.identify(userId, role ? { role } : undefined);
    }
  }, [userId, role]);

  return null;
}
