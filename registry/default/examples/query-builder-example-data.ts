import type { QueryField, QueryGroup } from "@/registry/default/product/query-builder/query-builder"

import { CATEGORY_OPTIONS, SAMPLE_ORDERS, STATUS_OPTIONS } from "./filter-bar-example-data"

/** The Filter Bar orders, keyed the way the fields below read them. */
export const ORDER_RECORDS = SAMPLE_ORDERS.map((order) => ({
  id: order.id,
  customer: order.customer,
  status: order.status.toLowerCase(),
  category: order.category.toLowerCase(),
  amount: order.amount,
  createdAt: order.createdAt,
}))

export const ORDER_FIELDS: QueryField[] = [
  { key: "status", label: "Status", type: "multi-select", options: STATUS_OPTIONS },
  { key: "category", label: "Category", type: "multi-select", options: CATEGORY_OPTIONS },
  { key: "customer", label: "Customer", type: "text", meta: { placeholder: "Customer name" } },
  { key: "amount", label: "Amount", type: "number", meta: { prefix: "$", min: 0 } },
  { key: "createdAt", label: "Created", type: "date" },
]

/** Active or pending orders that are either large or design work. */
export const DEMO_QUERY: QueryGroup = {
  id: "root",
  kind: "group",
  combinator: "and",
  children: [
    { id: "status", kind: "condition", field: "status", operator: "is", value: ["active", "pending"] },
    {
      id: "size-or-design",
      kind: "group",
      combinator: "or",
      children: [
        { id: "amount", kind: "condition", field: "amount", operator: "greater-than", value: 1000 },
        { id: "category", kind: "condition", field: "category", operator: "is", value: ["design"] },
      ],
    },
  ],
}
