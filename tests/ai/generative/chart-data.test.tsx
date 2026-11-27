// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Renderer, honestChatLibrary } from "@/registry/honest-ai/generative";
import { groupDigits, isIdentifierLabel, looksLikeYears } from "@/registry/honest-ai/generative/renderers/shared";
import { niceRange } from "@/registry/honest-ai/generative/renderers/charts";

function render(program: string) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <Renderer library={honestChatLibrary} response={program} />,
  );
  return container;
}

function dataRows(container: HTMLElement) {
  return [
    ...container.querySelectorAll('[data-slot="generated-chart-data"] tbody tr'),
  ].map((row) => [...row.children].map((cell) => cell.textContent));
}

describe("chart data tables", () => {
  it("lists each scatter point with its x and y", () => {
    const container = render(
      [
        "root = Stack([chart])",
        'chart = ScatterChart([a], "Hours studied", "Score")',
        'a = ScatterSeries("Class A", [Point(2, 61), Point(4, 72)])',
      ].join("\n"),
    );
    expect(dataRows(container)).toEqual([
      ["2", "61"],
      ["4", "72"],
    ]);
  });

  it("groups a bar chart's figures like the Table component", () => {
    const container = render(
      [
        "root = Stack([chart])",
        'chart = BarChart(["Rent", "Food"], [Series("Amount", [1200, 450])])',
      ].join("\n"),
    );
    expect(dataRows(container)).toEqual([
      ["Rent", "1,200"],
      ["Food", "450"],
    ]);
  });
});

describe("table figures", () => {
  it("keeps every digit the model wrote", () => {
    expect(groupDigits(3.14159265)).toBe("3.14159265");
    expect(groupDigits("2.7182818")).toBe("2.7182818");
    expect(groupDigits("3.1400")).toBe("3.1400");
    expect(groupDigits("1234.50")).toBe("1,234.50");
    expect(groupDigits("0012")).toBe("0012");
    expect(groupDigits(1250000)).toBe("1,250,000");
    expect(groupDigits(1e21)).not.toContain("e");
    expect(groupDigits(1e-7)).not.toContain("e");
    expect(groupDigits(1e-21)).toBe("1e-21");
    expect(groupDigits("-48200.5")).toBe("-48,200.5");
    // Past Number.MAX_SAFE_INTEGER, Number() would change the last digit.
    expect(groupDigits("9007199254740993")).toBe("9,007,199,254,740,993");
  });

  it("leaves formatted text and years as written", () => {
    expect(groupDigits("$1,200")).toBe("$1,200");
    expect(groupDigits(2024, true)).toBe("2024");
    // Values alone decide only where years are the likely axis.
    expect(looksLikeYears([2022, "2023", 2024], "", { leading: true })).toBe(true);
    expect(looksLikeYears([1960, 1980, 2000, 2020], "", { leading: true })).toBe(true);
    expect(looksLikeYears([2010, 2017, 2024, 2010, 2017, 2024], "", { leading: true })).toBe(true);
    expect(looksLikeYears([2024, 1250000], "", { leading: true })).toBe(false);
    expect(looksLikeYears([1500, 1800], "", { leading: true })).toBe(false);
    expect(looksLikeYears([1500])).toBe(false);
    // Elsewhere a header must say so; prices and rates are not years.
    expect(looksLikeYears([1199, 1249, 1299], "Price ($)")).toBe(false);
    expect(looksLikeYears([1199, 1249, 1299], "Price ($)", { leading: true })).toBe(false);
    expect(looksLikeYears([1500, 1520], "Population")).toBe(false);
    expect(looksLikeYears([1200], "Cost per year ($)")).toBe(false);
    expect(looksLikeYears([1200, 1300], "Salary / year", { leading: true })).toBe(false);
    expect(looksLikeYears([1900, 1950, 2000], "Census year")).toBe(true);
    // A period of amounts is not a column of years.
    for (const label of ["This year", "Last year", "Year to date", "Revenue this year", "This year ($)"])
      expect(looksLikeYears([1200, 1450, 1810], label), label).toBe(false);
    expect(looksLikeYears([1200, 1230], "Last year", { leading: true })).toBe(false);
    expect(looksLikeYears([2022, 2023], "Year to date", { leading: true })).toBe(false);
    expect(looksLikeYears([1200, 1500, 1800], "Year 1")).toBe(false);
    expect(looksLikeYears([2021, 2022, 2023], "Year-end balance", { leading: true })).toBe(false);
    expect(looksLikeYears([2024], "Season")).toBe(true);
  });

  it("right-aligns a numeric-string column and keeps a season column ungrouped", () => {
    const container = render(
      [
        "root = Stack([t])",
        't = Table([Col("Season", [2023, 2024]), Col("Count", ["1200", "34000"])])',
      ].join("\n"),
    );
    const cells = [...container.querySelectorAll("tbody td")].map((cell) => cell.textContent);
    expect(cells).toEqual(["2023", "1,200", "2024", "34,000"]);
    // A year column labels rows, so it stays start-aligned.
    const headers = [...container.querySelectorAll("thead th")];
    expect(headers[0].className).not.toContain("text-end");
    expect(headers[1].className).toContain("text-end");
  });
});

describe("scatter axis bounds", () => {
  it("lands on a 1, 2 or 5 step and never goes below zero for positive data", () => {
    expect(niceRange([47.08, 82.92])).toEqual({ min: 40, max: 90 });
    // A point on a bound gets a step of room; positive data starts at zero.
    expect(niceRange([0, 100])).toEqual({ min: 0, max: 120 });
    expect(niceRange([1, 6])).toEqual({ min: 0, max: 7 });
    expect(niceRange([0.3, 0.7])).toEqual({ min: 0.2, max: 0.8 });
    expect(niceRange([-12, 30])).toEqual({ min: -20, max: 40 });
    // A percentage stops at 100.
    expect(niceRange([42, 100], false, true)).toEqual({ min: 40, max: 100 });
    expect(niceRange([95, 100], false, true).max).toBe(100);
  });

  it("keeps a short span of years on whole years", () => {
    // A year on the edge gets a step of room.
    expect(niceRange([2023, 2024, 2025], true)).toEqual({ min: 2022, max: 2026 });
    expect(niceRange([2015, 2024], true)).toEqual({ min: 2014, max: 2026 });
    expect(niceRange([2024], true)).toEqual({ min: 2023, max: 2025 });
  });

  it("gives a single value some room", () => {
    const { min, max } = niceRange([0, 0]);
    expect(min).toBe(0);
    expect(max).toBeGreaterThan(0);
  });
});

describe("identifiers and years", () => {
  it("keeps ZIP codes, prices and order numbers exactly as written", () => {
    const container = render(
      [
        "root = Stack([t])",
        't = Table([Col("Order #", ["10234", "10235"]), Col("ZIP", ["02139", "00501"]), Col("Price", ["1.50", "12.00"])])',
      ].join("\n"),
    );
    const cells = [...container.querySelectorAll("tbody td")].map((cell) => cell.textContent);
    expect(cells).toEqual(["10234", "02139", "1.50", "10235", "00501", "12.00"]);
    const headers = [...container.querySelectorAll("thead th")];
    expect(headers[0].className).not.toContain("text-end");
    expect(headers[2].className).toContain("text-end");
  });

  it("does not group years in a scatter chart's data table", () => {
    const container = render(
      [
        "root = Stack([chart])",
        'chart = ScatterChart([a], "Year", "Share (%)")',
        'a = ScatterSeries("Share", [Point(2015, 12.5), Point(2018, 31)])',
      ].join("\n"),
    );
    // One series: its name is the caption, not a repeated column.
    expect(dataRows(container)).toEqual([
      ["2015", "12.5"],
      ["2018", "31"],
    ]);
  });
});

describe("identifier headers", () => {
  it("tells identifiers from counts", () => {
    for (const label of ["Order #", "Account number", "Invoice no.", "ZIP", "SKU", "Customer ID", "Phone"])
      expect(isIdentifierLabel(label), label).toBe(true);
    for (const label of ["# of guests", "No. of rooms", "Number of users", "Lines of code", "Total number", "Units (#)", "Population (no.)", "Quantity", "Price"])
      expect(isIdentifierLabel(label), label).toBe(false);
  });
});

describe("view data names", () => {
  it("names each chart's View data so several can be told apart", () => {
    const container = render(
      [
        "root = Stack([a, b])",
        'a = BarChart(["Jan", "Feb"], [Series("Orders", [12, 18])])',
        'b = LineChart(["Jan", "Feb"], [Series("Returns", [2, 3])])',
      ].join("\n"),
    );
    const summaries = [...container.querySelectorAll('[data-slot="generated-chart-data"] summary')].map(
      (summary) => summary.textContent,
    );
    expect(summaries).toEqual(["View data for Orders", "View data for Returns"]);
    const firstHeader = container.querySelector('[data-slot="generated-chart-data"] thead th')!;
    expect(firstHeader.className).toContain("text-start");
  });

  it("names a chart from its series when axis labels are partial or missing", () => {
    const container = render(
      [
        "root = Stack([a, b])",
        'a = ScatterChart([p, q])',
        'p = ScatterSeries("North", [Point(1, 2)])',
        'q = ScatterSeries("South", [Point(2, 3)])',
        'b = BarChart(["Jan", "Feb"], [Series("Orders", [12, 18])], "grouped", "Month")',
      ].join("\n"),
    );
    const summaries = [...container.querySelectorAll('[data-slot="generated-chart-data"] summary')].map(
      (summary) => summary.textContent,
    );
    expect(summaries).toEqual(["View data for North, South", "View data for Orders by month"]);
    expect(container.textContent).toContain("The axes aren’t labeled");
    // Several series and no labels: the legend names them, so no caption repeats it.
    const captions = [...container.querySelectorAll("figcaption")].map((caption) => caption.textContent);
    expect(captions).toEqual(["Orders by month"]);
  });
});
