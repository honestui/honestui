"use client";

import { useEffect, useState } from "react";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/registry/default/product/data-table/data-table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { customers, healthStatuses, planNames } from "@/lib/dashboard/data";
import { formatCurrency, formatNumber } from "@/lib/dashboard/format";
import type { Customer, HealthStatus } from "@/lib/dashboard/types";

const healthBadgeVariant: Record<
  HealthStatus,
  "success" | "warning" | "error"
> = {
  Healthy: "success",
  Watch: "warning",
  "At risk": "error",
};

const avatarColors = ["indigo", "sky", "mint", "gold", "iris"] as const;

function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return avatarColors[hash % avatarColors.length];
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <span className="flex items-center gap-2.5">
        <Avatar size="4" shape="rounded" color={avatarColor(row.original.name)}>
          <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.name}</span>
      </span>
    ),
  },
  {
    accessorKey: "plan",
    header: "Plan",
    enableSorting: false,
  },
  {
    accessorKey: "mrr",
    header: "MRR",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">{formatCurrency(row.original.mrr)}</span>
    ),
  },
  {
    accessorKey: "seats",
    header: "Seats",
    enableSorting: false,
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.seats)}</span>
    ),
  },
  {
    accessorKey: "health",
    header: "Health",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={healthBadgeVariant[row.original.health]} size="sm">
        {row.original.health}
      </Badge>
    ),
  },
  {
    accessorKey: "lastActive",
    header: "Last active",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.lastActive}</span>
    ),
  },
];

export function CustomersSection() {
  // Below md, drop the secondary columns instead of cramming six columns
  // into a phone viewport. The toolbar's view menu can bring them back.
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () =>
      setColumnVisibility(
        query.matches ? { seats: false, lastActive: false } : {},
      );
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <section aria-label="Customers">
      <h2 className="text-base font-semibold">Customers</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Accounts ranked by recurring revenue
      </p>

      <div className="mt-5">
        <DataTable
          columns={columns}
          data={customers}
          caption="Customer accounts"
          search={{ placeholder: "Search customers..." }}
          filters={[
            {
              columnId: "plan",
              title: "Plan",
              options: planNames.map((plan) => ({ label: plan, value: plan })),
            },
            {
              columnId: "health",
              title: "Health",
              options: healthStatuses.map((health) => ({
                label: health,
                value: health,
              })),
            },
          ]}
          pagination={{ pageSizeOptions: [10, 20] }}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          getRowId={(customer) => customer.id}
          getRowLabel={(row) => row.original.name}
          noResultsState={
            <Empty className="p-10">
              <EmptyHeader>
                <EmptyTitle>No customers found</EmptyTitle>
                <EmptyDescription>
                  Try changing your filters or search.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </div>
    </section>
  );
}
