"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const ANALYTICS_PREFERENCE_STORAGE_KEY =
  "honestui.analytics-enabled.v1";
const ANALYTICS_PREFERENCE_EVENT =
  "honestui:analytics-preference-changed";

type AnalyticsState =
  | { enabled: boolean; browserPrivacySignal: boolean }
  | undefined;

function browserRequestsPrivacy() {
  if (typeof window === "undefined") return false;

  const privacyNavigator = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  const legacyDoNotTrack = (window as Window & { doNotTrack?: string })
    .doNotTrack;

  return (
    privacyNavigator.globalPrivacyControl === true ||
    privacyNavigator.doNotTrack === "1" ||
    legacyDoNotTrack === "1"
  );
}

function readAnalyticsState(): Exclude<AnalyticsState, undefined> {
  const browserPrivacySignal = browserRequestsPrivacy();

  try {
    return {
      browserPrivacySignal,
      enabled:
        !browserPrivacySignal &&
        window.localStorage.getItem(ANALYTICS_PREFERENCE_STORAGE_KEY) !==
          "false",
    };
  } catch {
    return { browserPrivacySignal, enabled: !browserPrivacySignal };
  }
}

function writeAnalyticsPreference(enabled: boolean) {
  try {
    if (enabled) {
      window.localStorage.removeItem(ANALYTICS_PREFERENCE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ANALYTICS_PREFERENCE_STORAGE_KEY, "false");
    }
  } catch {
    // The choice still applies to this page through the event below.
  }

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_PREFERENCE_EVENT, { detail: enabled }),
  );
}

function useAnalyticsState() {
  const [state, setState] = useState<AnalyticsState>(undefined);

  useEffect(() => {
    const syncState = () => setState(readAnalyticsState());
    const syncPreference = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      if (typeof event.detail !== "boolean") return;

      const browserPrivacySignal = browserRequestsPrivacy();
      setState({
        browserPrivacySignal,
        enabled: !browserPrivacySignal && event.detail,
      });
    };
    const syncStoredState = (event: StorageEvent) => {
      if (event.key === ANALYTICS_PREFERENCE_STORAGE_KEY) syncState();
    };

    window.queueMicrotask(syncState);
    window.addEventListener(ANALYTICS_PREFERENCE_EVENT, syncPreference);
    window.addEventListener("storage", syncStoredState);
    return () => {
      window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, syncPreference);
      window.removeEventListener("storage", syncStoredState);
    };
  }, []);

  return state;
}

function filterAnalyticsEvent<Event extends { url: string }>(
  event: Event,
): Event | null {
  if (!readAnalyticsState().enabled) return null;

  try {
    const url = new URL(event.url);
    url.hash = "";
    url.search = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

export function SiteAnalytics() {
  const state = useAnalyticsState();

  return state?.enabled ? (
    <VercelAnalytics beforeSend={filterAnalyticsEvent} />
  ) : null;
}

export function AnalyticsPreferences() {
  const state = useAnalyticsState();
  const status = !state
    ? "Loading your preference."
    : state.browserPrivacySignal
      ? "Analytics are disabled because your browser sends a privacy signal."
      : state.enabled
        ? "Aggregate traffic analytics are enabled."
        : "Aggregate traffic analytics are disabled.";

  return (
    <section
      aria-labelledby="analytics-preferences-title"
      className="rounded-[var(--hui-radius-4)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-5"
    >
      <h2 id="analytics-preferences-title" className="text-xl font-medium">
        Analytics preference
      </h2>
      <p
        className="mt-2 text-sm text-[var(--hui-color-foreground-base-secondary)]"
        role="status"
      >
        {status}
      </p>
      {state ? (
        <Button
          className="mt-5"
          disabled={state.browserPrivacySignal}
          onClick={() => writeAnalyticsPreference(!state.enabled)}
          variant={state.enabled ? "outline" : "default"}
        >
          {state.enabled ? "Disable analytics" : "Enable analytics"}
        </Button>
      ) : null}
    </section>
  );
}
