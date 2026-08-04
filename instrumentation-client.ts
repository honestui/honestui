import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const cloudRegion =
  host === "https://eu.i.posthog.com"
    ? "eu"
    : host === "https://us.i.posthog.com"
      ? "us"
      : null;

if (projectToken && host) {
  posthog.init(projectToken, {
    // Keep cloud ingestion first-party so content blockers drop fewer events.
    // Self-hosted PostHog instances continue to use their configured host.
    api_host: cloudRegion ? "/relay" : host,
    ...(cloudRegion ? { ui_host: `https://${cloudRegion}.posthog.com` } : {}),
    defaults: "2026-05-30",
    autocapture: true,
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    capture_heatmaps: true,
    capture_performance: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  const missingVariable = !projectToken
    ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
    : "NEXT_PUBLIC_POSTHOG_HOST";
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}
