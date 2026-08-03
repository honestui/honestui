import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const configuredSiteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.honestui.com";

// Keep every SEO URL on the hostname that serves the final 200 response.
export const SITE_URL = configuredSiteUrl
  .replace(/^https:\/\/honestui\.com(?=\/|$)/, "https://www.honestui.com")
  .replace(/\/$/, "");

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
