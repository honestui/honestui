const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat("en-US");

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "$84,240" */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** "$84.2K" — for chart axes and tight spots. */
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}

/** "24,820" */
export function formatNumber(value: number): string {
  return number.format(value);
}

/** "24.8K" */
export function formatCompactNumber(value: number): string {
  return compactNumber.format(value);
}

/** "2.4%" */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** "Aug 14" from an ISO date string. */
export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
