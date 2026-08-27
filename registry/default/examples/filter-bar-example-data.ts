import type { FilterDateRangePreset, FilterOption } from "@/registry/default/product/filter-bar/filter-bar-types"

export interface OrderRow {
  id: string
  customer: string
  status: "Active" | "Pending" | "Archived" | "Draft"
  category: string
  amount: number
  createdAt: Date
}

const startOfToday = () => {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export const ORDER_STATUSES = ["Active", "Pending", "Archived", "Draft"] as const

export const STATUS_OPTIONS: FilterOption[] = [
  { label: "Active", value: "active", count: 124 },
  { label: "Pending", value: "pending", count: 32 },
  { label: "Archived", value: "archived", count: 18 },
  { label: "Draft", value: "draft", count: 7 },
]

export const CATEGORY_OPTIONS: FilterOption[] = [
  { label: "Design", value: "design", count: 64 },
  { label: "Development", value: "development", count: 128 },
  { label: "Marketing", value: "marketing", count: 48 },
  { label: "Sales", value: "sales", count: 36 },
  { label: "Support", value: "support", count: 27 },
  { label: "Operations", value: "operations", count: 21 },
  { label: "Finance", value: "finance", count: 19 },
  { label: "Legal", value: "legal", count: 12 },
  { label: "People", value: "people", count: 9 },
  { label: "Facilities", value: "facilities", count: 8 },
  { label: "Research", value: "research", count: 15 },
  { label: "Localization", value: "localization", count: 11 },
  { label: "Security", value: "security", count: 13 },
  { label: "Partnerships", value: "partnerships", count: 6 },
]

/** Server stand-in: a stable slice per query so repeats look deterministic. */
export const CUSTOMER_DIRECTORY = [
  "Acme International Holdings",
  "Brightline Studio",
  "Cortado Labs",
  "Dunder Marble Group",
  "Everly & Sons",
  "Fable Foods Co-op",
  "Globex Manufacturing",
  "Harbor Freight Partners",
  "Initech Solutions",
  "Juno Analytics",
  "Kestrel Aviation",
  "Lumen Utilities",
  "Mosswood Retail",
  "Nimbus Cloudworks",
  "Orchard Robotics",
  "Pinecrest Insurance",
  "Quarry Mining Alliance",
  "Ridgeline Logistics",
  "Solstice Energy",
  "Tidewater Shipping",
]

export const CREATED_PRESETS: FilterDateRangePreset[] = [
  {
    label: "Last 7 days",
    value: () => ({
      from: new Date(startOfToday().getTime() - 6 * 24 * 60 * 60 * 1000),
      to: startOfToday(),
    }),
  },
  {
    label: "Last 30 days",
    value: () => ({
      from: new Date(startOfToday().getTime() - 29 * 24 * 60 * 60 * 1000),
      to: startOfToday(),
    }),
  },
  {
    label: "This month",
    value: () => {
      const today = startOfToday()

      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: today,
      }
    },
  },
]

function daysAgo(days: number) {
  return new Date(startOfToday().getTime() - days * 24 * 60 * 60 * 1000)
}

export const SAMPLE_ORDERS: OrderRow[] = [
  { id: "o-1001", customer: "Acme International Holdings", status: "Active", category: "Design", amount: 480, createdAt: daysAgo(2) },
  { id: "o-1002", customer: "Brightline Studio", status: "Pending", category: "Development", amount: 1200, createdAt: daysAgo(4) },
  { id: "o-1003", customer: "Cortado Labs", status: "Active", category: "Marketing", amount: 95, createdAt: daysAgo(9) },
  { id: "o-1004", customer: "Dunder Marble Group", status: "Archived", category: "Sales", amount: 750, createdAt: daysAgo(15) },
  { id: "o-1005", customer: "Everly & Sons", status: "Draft", category: "Support", amount: 40, createdAt: daysAgo(22) },
  { id: "o-1006", customer: "Fable Foods Co-op", status: "Active", category: "Finance", amount: 3200, createdAt: daysAgo(31) },
  { id: "o-1007", customer: "Globex Manufacturing", status: "Pending", category: "Operations", amount: 145, createdAt: daysAgo(33) },
  { id: "o-1008", customer: "Harbor Freight Partners", status: "Active", category: "Design", amount: 560, createdAt: daysAgo(41) },
  { id: "o-1009", customer: "Initech Solutions", status: "Archived", category: "Legal", amount: 900, createdAt: daysAgo(52) },
  { id: "o-1010", customer: "Juno Analytics", status: "Active", category: "Research", amount: 210, createdAt: daysAgo(58) },
]
