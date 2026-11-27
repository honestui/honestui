import { describe, expect, it } from "vitest"

import {
  applyMapping,
  detectColumnType,
  detectValueType,
  getMissingRequiredFields,
  headerSimilarity,
  isTypeCompatible,
  normalizeHeader,
  profileColumns,
  setColumnField,
  suggestMapping,
  toMappedTable,
} from "../../registry/default/product/csv-column-mapper/csv-column-mapper-utils"
import type { CsvMapperField } from "../../registry/default/product/csv-column-mapper/csv-column-mapper-types"

const fields: CsvMapperField[] = [
  { key: "name", label: "Name", aliases: ["Full name"], required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "company", label: "Company", aliases: ["Organization"] },
  { key: "seats", label: "Seats", type: "integer" },
  { key: "startDate", label: "Start date", type: "date" },
]

describe("detectValueType", () => {
  it.each([
    ["", null],
    ["  ", null],
    ["yes", "boolean"],
    ["FALSE", "boolean"],
    ["ana@northwind.example", "email"],
    ["https://honestui.com", "url"],
    ["12%", "percent"],
    ["$12,400", "currency"],
    ["12,400 €", "currency"],
    ["USD 90", "currency"],
    ["1,250", "integer"],
    ["-42", "integer"],
    ["3.14", "number"],
    ["1e5", "number"],
    ["2026-03-04", "date"],
    ["3/4/2026", "date"],
    ["04.03.2026", "date"],
    ["Mar 4, 2026", "date"],
    ["4 March 2026", "date"],
    ["Northwind, Inc.", "text"],
  ])("reads %j as %s", (raw, type) => {
    expect(detectValueType(raw)).toBe(type)
  })
})

describe("detectColumnType", () => {
  it("is empty when every cell is blank", () => {
    expect(detectColumnType(["", " "])).toEqual({ type: "empty", confidence: 1 })
  })

  it("widens whole numbers and decimals to number, and plain numbers into currency", () => {
    expect(detectColumnType(["1", "2.5", "3"]).type).toBe("number")
    expect(detectColumnType(["$1,200", "900", "$40"]).type).toBe("currency")
  })

  it("keeps whole numbers as integers when no cell needs a wider type", () => {
    expect(detectColumnType(["1", "2", "3"]).type).toBe("integer")
  })

  it("falls back to text when too few cells agree", () => {
    const { type, confidence } = detectColumnType(["12", "5", "ten", "2", "a few"])
    expect(type).toBe("text")
    expect(confidence).toBeCloseTo(0.4)
  })

  it("tolerates a few stray cells above the threshold", () => {
    expect(detectColumnType(["1", "2", "3", "4", "n/a"]).type).toBe("integer")
  })

  it("ignores blank cells", () => {
    expect(detectColumnType(["", "2026-01-02", ""])).toEqual({ type: "date", confidence: 1 })
  })
})

describe("profileColumns", () => {
  it("reports type, blanks, and the first non-empty samples", () => {
    const [profile] = profileColumns(["Seats"], [["12"], [""], ["5"], ["8"], ["3"]], { sampleCount: 2 })
    expect(profile).toEqual({ index: 0, header: "Seats", type: "integer", confidence: 1, samples: ["12", "5"], emptyCount: 1 })
  })
})

describe("header matching", () => {
  it("normalizes case, accents, and punctuation", () => {
    expect(normalizeHeader("E-mail Address")).toBe("emailaddress")
    expect(normalizeHeader("Créé le")).toBe("creele")
  })

  it("scores similar names", () => {
    expect(headerSimilarity("Email", "email")).toBe(1)
    expect(headerSimilarity("E-mail address", "Email")).toBeGreaterThan(0.72)
    expect(headerSimilarity("Organisation", "Organization")).toBeGreaterThan(0.9)
    expect(headerSimilarity("Deal size", "Seats")).toBeLessThan(0.5)
  })

  it("maps exact names and aliases first, then similar names, one column per field", () => {
    const { mapping, suggestions } = suggestMapping(["Full name", "Work email", "Organisation", "Email", "Notes"], fields)
    expect(mapping).toEqual(["name", null, "company", "email", null])
    expect(suggestions.map((entry) => entry?.reason ?? null)).toEqual(["alias", null, "similar", "name", null])
  })

  it("passes over a similar name whose values disagree with the field type", () => {
    const headers = ["Start"]
    const rows = [["Q3"], ["Q4"], ["soon"]]
    const profiles = profileColumns(headers, rows)
    expect(suggestMapping(headers, fields, { profiles }).mapping).toEqual([null])
    expect(suggestMapping(headers, fields).mapping).toEqual(["startDate"])
  })

  it("still maps an exact name with disagreeing values", () => {
    const profiles = profileColumns(["Seats"], [["ten"], ["five"]])
    expect(suggestMapping(["Seats"], fields, { profiles }).mapping).toEqual(["seats"])
  })
})

describe("mapping helpers", () => {
  it("moves a field to its new column", () => {
    expect(setColumnField(["name", null, "email"], 1, "name")).toEqual([null, "name", "email"])
    expect(setColumnField(["name", null], 0, null)).toEqual([null, null])
  })

  it("lists required fields with no column", () => {
    expect(getMissingRequiredFields(["name", null], fields).map((field) => field.key)).toEqual(["email"])
  })

  it("knows which column types each field accepts", () => {
    expect(isTypeCompatible(undefined, "date")).toBe(true)
    expect(isTypeCompatible("integer", "number")).toBe(false)
    expect(isTypeCompatible("currency", "integer")).toBe(true)
    expect(isTypeCompatible("email", "empty")).toBe(true)
  })

  it("applies a mapping to rows and builds a labelled table in field order", () => {
    const rows = [
      [" Ana ", "ana@x.example", "ignored"],
      ["Li", "li@x.example", ""],
    ]
    const mapping = ["name", "email", null]
    expect(applyMapping(rows, mapping)).toEqual([
      { name: "Ana", email: "ana@x.example" },
      { name: "Li", email: "li@x.example" },
    ])
    expect(toMappedTable(rows, ["email", "name", null], fields)).toEqual([
      ["Name", "Email"],
      ["ana@x.example", "Ana"],
      ["li@x.example", "Li"],
    ])
  })
})
