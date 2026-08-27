import { describe, expect, it } from "vitest"

import type {
  FilterDefinition,
  FilterValue,
} from "../../registry/default/product/filter-bar/filter-bar-types"
import {
  formatFilterValueText,
  isActiveFilterValue,
  resolveFilterOptionValue,
} from "../../registry/default/product/filter-bar/filter-bar-utils"

const textDefinition: FilterDefinition = {
  key: "customer",
  label: "Customer",
  type: "text",
}

describe("Filter Bar value utilities", () => {
  it("keeps valueless operators active and names their rule", () => {
    const entry: FilterValue = {
      key: "customer",
      operator: "is-not-empty",
      value: undefined,
    }

    expect(isActiveFilterValue(textDefinition, entry)).toBe(true)
    expect(formatFilterValueText(textDefinition, entry)).toBe("Is not empty")
  })

  it("restores the original option value type", () => {
    const definition: FilterDefinition = {
      key: "code",
      label: "Code",
      type: "select",
      options: [
        { label: "Numeric", value: 7 },
        { label: "Padded", value: "007" },
      ],
    }

    expect(resolveFilterOptionValue(definition, "7")).toBe(7)
    expect(resolveFilterOptionValue(definition, "007")).toBe("007")
    expect(resolveFilterOptionValue(definition, "missing")).toBe("missing")
  })

  it("keeps a multi-select chip compact without dropping the filter", () => {
    const definition: FilterDefinition = {
      key: "category",
      label: "Category",
      type: "multi-select",
      options: [
        { label: "Design", value: "design" },
        { label: "Development", value: "development" },
        { label: "Marketing", value: "marketing" },
        { label: "Sales", value: "sales" },
      ],
    }

    expect(
      formatFilterValueText(definition, {
        key: "category",
        operator: "is",
        value: ["design", "development", "marketing", "sales"],
      })
    ).toBe("Design +3")
  })
})
