import type { ComponentType } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CirclePlus,
  RefreshCw,
  UserPlus,
} from "honestui/icons";

import { recentActivity } from "@/lib/dashboard/data";
import type { ActivityKind } from "@/lib/dashboard/types";

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

const kindIcons: Record<ActivityKind, IconComponent> =
  {
    upgrade: ArrowUpRight,
    expansion: CirclePlus,
    renewal: RefreshCw,
    contraction: ArrowDownRight,
    trial: UserPlus,
  };

export function RecentActivity() {
  return (
    <section aria-label="Recent activity" className="min-w-0">
      <h2 className="text-base font-semibold">Recent activity</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Latest account events across the workspace
      </p>

      <ul className="mt-4 divide-y divide-border">
        {recentActivity.map((item) => {
          const Icon = kindIcons[item.kind];
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <Icon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium">{item.customer}</span>{" "}
                <span className="text-muted-foreground">
                  {item.event.charAt(0).toLowerCase() + item.event.slice(1)}
                </span>
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
