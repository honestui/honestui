import { describe, expect, it } from "vitest"

import {
  defaultAuditLogLabels,
  filterEntries,
  formatDayHeading,
  formatEntryTime,
  getActors,
  getCategories,
  getDayKey,
  getInitials,
  groupEntriesByDay,
} from "../../registry/default/product/audit-log/audit-log-utils"
import type { AuditLogEntry } from "../../registry/default/product/audit-log/audit-log-types"

const now = new Date(Date.UTC(2026, 10, 26, 15, 30))
const at = (daysAgo: number, hour: number, minute = 0) =>
  Date.UTC(2026, 10, 26 - daysAgo, hour, minute)

const entries: AuditLogEntry[] = [
  {
    id: "a",
    actor: { id: "u1", name: "Ana Ruiz" },
    action: "edited",
    timestamp: at(1, 9),
    category: "Billing",
  },
  {
    id: "b",
    actor: { name: "Dee Park" },
    action: "invited",
    timestamp: at(0, 14),
    category: "Members",
  },
  {
    id: "c",
    actor: { id: "u1", name: "Ana Ruiz" },
    action: "deleted",
    timestamp: new Date(at(0, 15)),
  },
  {
    id: "d",
    actor: { name: "Dee Park" },
    action: "edited",
    timestamp: new Date(at(5, 8)).toISOString(),
    category: "Billing",
  },
]

describe("audit log grouping", () => {
  it("sorts newest first and groups by day in the given zone", () => {
    const days = groupEntriesByDay(entries, "UTC")
    expect(days.map((day) => day.key)).toEqual(["2026-11-26", "2026-11-25", "2026-11-21"])
    expect(days[0].entries.map((entry) => entry.id)).toEqual(["c", "b"])
  })

  it("moves an entry across midnight when the zone changes", () => {
    const late = new Date(Date.UTC(2026, 10, 26, 2, 0))
    expect(getDayKey(late, "UTC")).toBe("2026-11-26")
    expect(getDayKey(late, "America/Los_Angeles")).toBe("2026-11-25")
  })

  it("names today, yesterday, and older days", () => {
    const options = { locale: "en-US", timeZone: "UTC" }
    const [today, yesterday, older] = groupEntriesByDay(entries, "UTC")
    expect(formatDayHeading(today, now, defaultAuditLogLabels, options)).toBe("Today")
    expect(formatDayHeading(yesterday, now, defaultAuditLogLabels, options)).toBe("Yesterday")
    expect(formatDayHeading(older, now, defaultAuditLogLabels, options)).toBe(
      "Saturday, November 21"
    )
  })
})

describe("audit log times", () => {
  const options = { locale: "en-US", timeZone: "UTC" }

  it("uses relative time today and clock time before", () => {
    expect(formatEntryTime(new Date(at(0, 15, 29)), now, defaultAuditLogLabels, options)).toBe(
      "1 min ago"
    )
    expect(formatEntryTime(new Date(at(0, 15, 30)), now, defaultAuditLogLabels, options)).toBe(
      "Just now"
    )
    expect(formatEntryTime(new Date(at(0, 12, 10)), now, defaultAuditLogLabels, options)).toBe(
      "3 hr ago"
    )
    expect(formatEntryTime(new Date(at(1, 17, 45)), now, defaultAuditLogLabels, options)).toBe(
      "5:45 PM"
    )
  })
})

describe("audit log filters", () => {
  it("filters by actor id or name, and by category", () => {
    expect(filterEntries(entries, { actor: "u1" }).map((entry) => entry.id)).toEqual(["a", "c"])
    expect(
      filterEntries(entries, { actor: "Dee Park", category: "Billing" }).map((entry) => entry.id)
    ).toEqual(["d"])
    expect(filterEntries(entries, { actor: null })).toHaveLength(4)
  })

  it("lists actors once and categories sorted", () => {
    expect(getActors(entries).map((actor) => actor.name)).toEqual(["Ana Ruiz", "Dee Park"])
    expect(getCategories(entries)).toEqual(["Billing", "Members"])
  })

  it("makes initials", () => {
    expect(getInitials("Ana Ruiz")).toBe("AR")
    expect(getInitials("Mary Ann de la Cruz")).toBe("MC")
    expect(getInitials("deploy-bot")).toBe("DB")
    expect(getInitials("li")).toBe("LI")
  })
})
