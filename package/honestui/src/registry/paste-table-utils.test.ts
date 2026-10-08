import { describe, expect, it } from "vitest"

import {
  defaultPasteTableLabels,
  evaluateRows,
  getMissingColumns,
  mapColumnsByPosition,
  matchColumns,
  parseClipboardTable,
  parseDateCell,
  parseNumberCell,
} from "../../registry/default/product/paste-table/paste-table-utils"
import type { PasteTableColumn } from "../../registry/default/product/paste-table/paste-table-types"

describe("parseClipboardTable", () => {
  it("splits tab-separated rows and ignores the trailing line break Excel adds", () => {
    expect(parseClipboardTable("Name\tEmail\r\nAna\tana@acme.test\r\n")).toEqual([
      ["Name", "Email"],
      ["Ana", "ana@acme.test"],
    ])
  })

  it("accepts every line ending", () => {
    expect(parseClipboardTable("a\nb\rc\r\nd")).toEqual([["a"], ["b"], ["c"], ["d"]])
  })

  it("keeps tabs, line breaks, and doubled quotes inside a quoted cell", () => {
    expect(parseClipboardTable('"line one\nline two"\t"a\tb"\t"say ""hi"""\nnext\t\t')).toEqual([
      ["line one\nline two", "a\tb", 'say "hi"'],
      ["next", "", ""],
    ])
  })

  it("treats a quote in the middle of a cell as text", () => {
    expect(parseClipboardTable('5" pipe\t"quoted"')).toEqual([['5" pipe', "quoted"]])
  })

  it("trims cells, including no-break spaces", () => {
    expect(parseClipboardTable("  Ana \t 12 ")).toEqual([["Ana", "12"]])
  })

  it("drops blank rows and pads short rows", () => {
    expect(parseClipboardTable("a\tb\tc\n\n\t\t\nd")).toEqual([
      ["a", "b", "c"],
      ["d", "", ""],
    ])
  })

  it("returns no rows for empty or blank text", () => {
    expect(parseClipboardTable("")).toEqual([])
    expect(parseClipboardTable(" \n\t\n")).toEqual([])
  })

  it("does not split on commas unless asked to", () => {
    expect(parseClipboardTable("Park, Dee")).toEqual([["Park, Dee"]])
    expect(parseClipboardTable('"Park, Dee",3', ",")).toEqual([["Park, Dee", "3"]])
  })
})

describe("parseNumberCell", () => {
  it.each([
    ["12", 12],
    ["1,250", 1250],
    ["1,234,567.89", 1234567.89],
    ["-4.5", -4.5],
    ["−4.5", -4.5],
    ["+3", 3],
    [".5", 0.5],
    ["5.", 5],
    ["$1,200.50", 1200.5],
    ["-$5", -5],
    ["12 €", 12],
    ["(1,234.50)", -1234.5],
    ["1.5E+3", 1500],
    ["1 234.5", 1234.5],
  ])("reads %s with a point as the decimal separator", (raw, expected) => {
    expect(parseNumberCell(raw)).toBe(expected)
  })

  it.each([
    ["1.249,90", 1249.9],
    ["89,5", 89.5],
    ["1 249,90", 1249.9],
    ["-0,5", -0.5],
  ])("reads %s with a comma as the decimal separator", (raw, expected) => {
    expect(parseNumberCell(raw, ",")).toBe(expected)
  })

  it.each(["five", "", "1,5", "12,34.5", "1.2.3", "12%", "1,2345", "--1", "$", "1e", "(5"])(
    "rejects %s",
    (raw) => {
      expect(parseNumberCell(raw)).toBeNull()
    }
  )

  it("never reads a number written for the other separator", () => {
    expect(parseNumberCell("1.5", ",")).toBeNull()
    expect(parseNumberCell("1,234.5", ",")).toBeNull()
  })
})

describe("parseDateCell", () => {
  it("reads the same text as different days depending on the stated order", () => {
    expect(parseDateCell("03/04/2026", "mdy")).toBe("2026-03-04")
    expect(parseDateCell("03/04/2026", "dmy")).toBe("2026-04-03")
  })

  it("accepts slashes, hyphens, points, and single digits", () => {
    expect(parseDateCell("3/4/2026", "mdy")).toBe("2026-03-04")
    expect(parseDateCell("1.3.2026", "dmy")).toBe("2026-03-01")
    expect(parseDateCell("31-12-2026", "dmy")).toBe("2026-12-31")
  })

  it("accepts a year-first date for every order", () => {
    expect(parseDateCell("2026-04-01", "mdy")).toBe("2026-04-01")
    expect(parseDateCell("2026/4/1", "dmy")).toBe("2026-04-01")
    expect(parseDateCell("2026-04-01", "ymd")).toBe("2026-04-01")
  })

  it("rejects year-last dates when the order is year first", () => {
    expect(parseDateCell("03/04/2026", "ymd")).toBeNull()
  })

  it.each(["4/31/2026", "2/29/2026", "13/01/2026", "0/5/2026", "3/4/26", "2026-03-04 10:00", "March 4", ""])(
    "rejects %s",
    (raw) => {
      expect(parseDateCell(raw, "mdy")).toBeNull()
    }
  )

  it("accepts 29 February in a leap year", () => {
    expect(parseDateCell("2/29/2028", "mdy")).toBe("2028-02-29")
  })
})

const columns: PasteTableColumn[] = [
  { key: "name", label: "Name", aliases: ["Full name"], required: true },
  {
    key: "email",
    label: "Email",
    required: true,
    validate: (value) => (String(value).includes("@") ? undefined : "Enter an email address"),
  },
  { key: "seats", label: "Seats", type: "number" },
  { key: "startDate", label: "Start date", type: "date", dateOrder: "mdy" },
  {
    key: "endDate",
    label: "End date",
    type: "date",
    dateOrder: "mdy",
    validate: (value, { row }) =>
      typeof row.startDate === "string" && String(value) < row.startDate ? "Ends before it starts" : undefined,
  },
  {
    key: "status",
    label: "Status",
    parse: (raw) => (raw === "on" ? { value: true } : { error: "Enter on" }),
  },
]

describe("matchColumns", () => {
  it("matches labels, keys, and aliases without regard to case or punctuation", () => {
    expect(matchColumns(["FULL NAME", "e-mail", "start_date", "startDate", "Notes", ""], columns)).toEqual([
      "name",
      "email",
      "startDate",
      null,
      null,
      null,
    ])
  })

  it("maps nothing when no header is recognized", () => {
    expect(matchColumns(["Ana Ruiz", "ana@acme.test"], columns)).toEqual([null, null])
  })
})

describe("mapColumnsByPosition", () => {
  it("assigns fields in order and leaves extra columns unmapped", () => {
    expect(mapColumnsByPosition(2, columns)).toEqual(["name", "email"])
    expect(mapColumnsByPosition(8, columns).slice(5)).toEqual(["status", null, null])
  })
})

describe("getMissingColumns", () => {
  it("lists required fields with no column", () => {
    expect(getMissingColumns(["name", null, "seats"], columns)).toEqual(["Email"])
    expect(getMissingColumns(["email", "name"], columns)).toEqual([])
  })
})

describe("evaluateRows", () => {
  const mapping = ["name", "email", "seats", "startDate", "endDate", "status", null]
  const evaluate = (...rows: string[][]) =>
    evaluateRows(
      rows.map((cells, id) => ({ id, cells })),
      mapping,
      columns,
      defaultPasteTableLabels
    )

  it("returns typed values for a valid row and leaves out unmapped columns", () => {
    const [row] = evaluate(["Ana", "ana@acme.test", "1,250", "3/4/2026", "3/5/2026", "on", "ignored"])

    expect(row.isValid).toBe(true)
    expect(row.values).toEqual({
      name: "Ana",
      email: "ana@acme.test",
      seats: 1250,
      startDate: "2026-03-04",
      endDate: "2026-03-05",
      status: true,
    })
    expect(row.cells[6]).toBeNull()
  })

  it("imports an empty optional cell as null without calling parse or validate", () => {
    const [row] = evaluate(["Ana", "ana@acme.test", "", "", "", "", ""])

    expect(row.isValid).toBe(true)
    expect(row.values).toMatchObject({ seats: null, startDate: null, endDate: null, status: null })
  })

  it("reports each kind of invalid cell with its own message", () => {
    const [row] = evaluate(["", "ana", "five", "4/31/2026", "", "off", ""])

    expect(row.isValid).toBe(false)
    expect(row.cells.map((cell) => cell?.error)).toEqual([
      "Required",
      "Enter an email address",
      "Enter a number, such as 1,234.5",
      "Enter a date as MM/DD/YYYY",
      undefined,
      "Enter on",
      undefined,
    ])
    expect(row.values).not.toHaveProperty("seats")
  })

  it("lets validate compare fields in the same row", () => {
    const [row] = evaluate(["Ana", "ana@acme.test", "", "3/4/2026", "3/1/2026", "", ""])

    expect(row.cells[4]?.error).toBe("Ends before it starts")
  })

  it("keeps row ids so edits can be matched after rows are removed", () => {
    const results = evaluateRows(
      [{ id: 7, cells: ["Ana", "ana@acme.test"] }],
      ["name", "email"],
      columns,
      defaultPasteTableLabels
    )

    expect(results[0].id).toBe(7)
  })
})

describe("defaultPasteTableLabels", () => {
  it("uses singular and plural wording", () => {
    expect(defaultPasteTableLabels.import(1)).toBe("Import 1 row")
    expect(defaultPasteTableLabels.import(1200)).toBe("Import 1,200 rows")
    expect(defaultPasteTableLabels.summary({ rows: 4, problemRows: 0, problemCells: 0 })).toBe(
      "4 rows ready to import."
    )
    expect(defaultPasteTableLabels.summary({ rows: 4, problemRows: 3, problemCells: 3 })).toBe(
      "4 rows. 3 cells in 3 rows need fixing."
    )
    expect(defaultPasteTableLabels.summary({ rows: 1, problemRows: 1, problemCells: 1 })).toBe(
      "1 row. 1 cell in 1 row needs fixing."
    )
  })
})
