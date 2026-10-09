"use client"

import * as React from "react"
import { Ellipsis as EllipsisIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { DensityScope, type Density } from "@/registry/default/ui/density"
import { Input } from "@/registry/default/ui/input"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/registry/default/ui/menu"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"

const densities: Density[] = ["compact", "default", "comfortable"]

const statuses = [
  { label: "All statuses", value: "all" },
  { label: "Paid", value: "Paid" },
  { label: "Overdue", value: "Overdue" },
]

// Sample data for the demo.
const invoices = [
  { id: "INV-1042", customer: "Northwind Traders", status: "Paid", amount: "$1,280.00" },
  { id: "INV-1043", customer: "Contoso Ltd", status: "Overdue", amount: "$640.50" },
  { id: "INV-1044", customer: "Fabrikam Inc", status: "Paid", amount: "$2,115.75" },
]

export default function DensityDemo() {
  const [density, setDensity] = React.useState<Density>("compact")
  const [status, setStatus] = React.useState("all")
  const visibleInvoices = invoices.filter(
    (invoice) => status === "all" || invoice.status === status,
  )

  return (
    <div className="grid w-full min-w-0 max-w-3xl gap-[var(--hui-space-7)]">
      <section
        aria-labelledby="density-demo-invoices"
        className="grid min-w-0 gap-[var(--hui-space-3)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-[var(--hui-space-3)]">
          <p
            id="density-demo-invoices"
            className="[font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]"
          >
            Invoices
          </p>
          <div
            role="group"
            aria-label="Invoice table density"
            className="flex flex-wrap gap-[var(--hui-space-2)]"
          >
            {densities.map((value) => (
              <Button
                key={value}
                variant={density === value ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={density === value}
                onClick={() => setDensity(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <DensityScope
          density={density}
          data-testid="density-demo-table-scope"
          className="grid min-w-0 gap-[var(--hui-density-gap)]"
        >
          <div className="flex flex-wrap items-center gap-[var(--hui-density-gap)]">
            <Select items={statuses} value={status} onValueChange={(value) => setStatus(value ?? "all")}>
              <SelectTrigger aria-label="Filter by status" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {statuses.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <Button variant="secondary">Export</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Invoice</TableHead>
                <TableHead scope="col">Customer</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Amount</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                  <TableCell className="w-px">
                    <Menu>
                      <MenuTrigger
                        render={<Button variant="ghost" size="icon" />}
                        aria-label={`Actions for ${invoice.id}`}
                      >
                        <EllipsisIcon />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem>View invoice</MenuItem>
                        <MenuItem>Download PDF</MenuItem>
                        <MenuItem>Send reminder</MenuItem>
                      </MenuPopup>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DensityScope>
      </section>

      <DensityScope density="comfortable" data-testid="density-demo-form-scope">
        <form
          aria-labelledby="density-demo-reminder"
          className="grid max-w-sm gap-[var(--hui-density-gap)]"
          onSubmit={(event) => event.preventDefault()}
        >
          <p
            id="density-demo-reminder"
            className="[font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]"
          >
            Reminder settings
          </p>
          <label
            htmlFor="density-demo-reply-to"
            className="[font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
          >
            Reply-to email
          </label>
          <Input id="density-demo-reply-to" type="email" autoComplete="email" />
          <Button type="submit">Save settings</Button>
        </form>
      </DensityScope>
    </div>
  )
}
