import { describe, expect, it } from "vitest"

import { buildDataGridCsv } from "../../registry/default/product/data-grid/data-grid-utils"

describe("buildDataGridCsv", () => {
  it.each([
    "=1+1",
    "+SUM(A1:A2)",
    "-2+3",
    "@SUM(1,2)",
    "\t=1+1",
    "\r=1+1",
    "\n=1+1",
    "\0=1+1",
    "\uFEFF=1+1",
    "\uFF0B1+1",
    "\uFF0D1+1",
    "\uFF1D1+1",
    "\uFF20SUM(1,2)",
  ])("treats formula-prefixed string data as text: %j", (value) => {
    const csv = buildDataGridCsv(["Value"], [[value]])

    expect(csv.split("\n").slice(1).join("\n")).toBe(
      `"'${value.replaceAll('"', '""')}"`,
    )
  })

  it("preserves numbers and escapes CSV syntax", () => {
    expect(
      buildDataGridCsv(
        ["Amount", "Description"],
        [[-42, 'Line one, with a "quote"']],
      ),
    ).toBe('"Amount","Description"\n"-42","Line one, with a ""quote"""')
  })
})
