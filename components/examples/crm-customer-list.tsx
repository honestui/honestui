"use client";

import {
  ArrowUpDown,
  Building2,
  Calendar,
  CalendarDays,
  CircleCheck,
  ChevronDown,
  ChevronsUpDown,
  CircleDollarSign,
  CircleQuestionMark,
  CircleUser,
  DollarSign,
  Ellipsis,
  FileChartColumn,
  GitMerge,
  GripHorizontal,
  GripVertical,
  House,
  Inbox,
  LayoutGrid,
  ListOrdered,
  Menu,
  MessageSquare,
  PanelLeft,
  Plus,
  Receipt,
  Repeat2,
  Save,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  SquareCheck,
  Users,
  UsersRound,
  Wallet,
} from "honestui/icons";
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  AvatarGroup,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CLIENTS = [
  { company: "Alder & Finch", contact: "Amara Okafor", annualValue: 184_250 },
  { company: "Brightwell Studio", contact: "Theo Bennett", annualValue: 96_500 },
  { company: "Copperline Labs", contact: "Priya Shah", annualValue: 231_800 },
  { company: "Driftwood Systems", contact: "Mateo Ruiz", annualValue: 147_750 },
  { company: "Emberfield Supply", contact: "Lena Park", annualValue: 119_200 },
  { company: "Fieldstone Health", contact: "Jonah Reed", annualValue: 208_400 },
  { company: "Glasswing Media", contact: "Noelle Kim", annualValue: 132_650 },
  { company: "Highwater Energy", contact: "Elias Grant", annualValue: 256_300 },
  { company: "Indigo Freight", contact: "Cora Ellis", annualValue: 101_900 },
  { company: "Kindred Software", contact: "Ravi Mehta", annualValue: 174_600 },
  { company: "Lantern Finance", contact: "Simone Brooks", annualValue: 222_500 },
  { company: "Meadowlark AI", contact: "Owen Clarke", annualValue: 158_750 },
  { company: "Oak & Orbit", contact: "Nadia Hassan", annualValue: 193_300 },
  { company: "Papertrail Legal", contact: "Miles Foster", annualValue: 88_400 },
  { company: "Quillstone Education", contact: "Imani Cole", annualValue: 267_900 },
  { company: "Redfern Robotics", contact: "Lucas Meyer", annualValue: 145_800 },
  { company: "Solace Travel", contact: "Freya Walsh", annualValue: 116_250 },
  { company: "Tidemark Commerce", contact: "Zain Malik", annualValue: 239_700 },
  { company: "Umbra Security", contact: "Ana Torres", annualValue: 179_450 },
  { company: "Verdant Kitchens", contact: "Hugo Martin", annualValue: 128_600 },
  { company: "Wildflower Data", contact: "Camille Laurent", annualValue: 214_900 },
  { company: "Yellowbrick Housing", contact: "Dev Patel", annualValue: 154_200 },
  { company: "Arc & Anchor", contact: "Sofia Rossi", annualValue: 198_750 },
  { company: "Bluebird Manufacturing", contact: "Ethan Wells", annualValue: 107_500 },
  { company: "Cloudharbor Networks", contact: "Leila Rahman", annualValue: 248_300 },
  { company: "Daylight Mobility", contact: "Nico Alvarez", annualValue: 136_900 },
  { company: "Everglade Materials", contact: "Maeve O'Donnell", annualValue: 169_800 },
  { company: "Foxglove Retail", contact: "Kenji Sato", annualValue: 225_600 },
  { company: "Goldenhour Hospitality", contact: "Aisha Bello", annualValue: 112_400 },
  { company: "Hearthside Ventures", contact: "Tomas Novak", annualValue: 187_250 },
] as const;

const AVATAR_COLORS = [
  "indigo",
  "crimson",
  "orange",
  "mint",
  "purple",
  "sky",
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const CLIENT_ROWS = CLIENTS.map((client, index) => ({
  ...client,
  annualValueLabel: decimalFormatter.format(client.annualValue),
  startDate: dateFormatter.format(new Date(Date.UTC(2026, 3, 8 + index * 5))),
  accountColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
  teamColors: [
    AVATAR_COLORS[(index + 1) % AVATAR_COLORS.length],
    AVATAR_COLORS[(index + 2) % AVATAR_COLORS.length],
    AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length],
  ],
}));

const TOTAL_ANNUAL_VALUE = CLIENTS.reduce(
  (total, client) => total + client.annualValue,
  0,
);

type IconComponent = typeof ArrowUpDown;

const HEADER_COLUMNS: Array<{ label: string; icon: IconComponent }> = [
  { label: "Company", icon: Building2 },
  { label: "Primary contact", icon: CircleUser },
  { label: "Owners", icon: UsersRound },
  { label: "Annual value", icon: CircleDollarSign },
  { label: "Start date", icon: Calendar },
];

const MAIN_NAV_ITEMS: Array<{ label: string; icon: IconComponent }> = [
  { label: "Dashboard", icon: House },
  { label: "Updates", icon: Inbox },
  { label: "Find", icon: Search },
  { label: "Conversations", icon: MessageSquare },
];

const COMPANY_NAV_ITEMS: Array<{
  label: string;
  icon: IconComponent;
  current?: boolean;
}> = [
  { label: "Pipeline", icon: Wallet },
  { label: "Clients", icon: Users, current: true },
  { label: "Agreements", icon: Repeat2 },
  { label: "Automations", icon: GitMerge },
  { label: "Follow-ups", icon: SquareCheck },
];

const SPACE_NAV_ITEMS: Array<{ label: string; icon: IconComponent }> = [
  { label: "Collections", icon: CircleCheck },
  { label: "Invoicing", icon: Receipt },
  { label: "Insights", icon: FileChartColumn },
  { label: "Extensions", icon: LayoutGrid },
  { label: "Resources", icon: Ellipsis },
];

const NAV_BUTTON_CLASS =
  "h-7 w-full justify-start gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]";

const ACTION_BUTTON_CLASS =
  "h-8 gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]";

function ColorAvatar({
  color,
  square = false,
  className,
}: {
  color: (typeof AVATAR_COLORS)[number];
  square?: boolean;
  className?: string;
}) {
  return (
    <Avatar
      aria-hidden="true"
      className={cn("size-4!", className)}
      color={color}
      shape={square ? "rounded" : "full"}
      size="1"
      variant="solid"
    />
  );
}

function NavigationItem({
  icon: Icon,
  label,
  collapsed,
  current = false,
}: {
  icon: IconComponent;
  label: string;
  collapsed: boolean;
  current?: boolean;
}) {
  return (
    <Button
      aria-current={current ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        NAV_BUTTON_CLASS,
        collapsed && "justify-center px-0",
        current &&
          "bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-color-foreground-base-primary)] hover:bg-[var(--hui-color-background-accent-primary)]",
      )}
      variant="link"
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 text-[var(--hui-color-foreground-base-tertiary)]",
          current && "text-[var(--hui-color-foreground-base-primary)]",
        )}
      />
      <span className={cn("truncate", collapsed && "hidden")}>{label}</span>
    </Button>
  );
}

function NavigationSection({
  label,
  items,
  collapsed,
  open,
  onOpenChange,
  className,
}: {
  label: string;
  items: Array<{ label: string; icon: IconComponent; current?: boolean }>;
  collapsed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  return (
    <Collapsible
      open={collapsed || open}
      onOpenChange={onOpenChange}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      <CollapsibleTrigger
        className={cn(
          "group flex items-center gap-2.5 px-1.5 outline-none focus-visible:[outline:var(--hui-focus-ring)]",
          collapsed && "hidden",
        )}
      >
        <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] transition-colors group-hover:text-[var(--hui-color-foreground-base-primary)]">
          {label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3 text-[var(--hui-color-foreground-base-tertiary)] transition-transform duration-200 group-data-panel-open:rotate-0 -rotate-90 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsiblePanel className="flex flex-col gap-1 overflow-hidden">
        {items.map((item) => (
          <NavigationItem
            key={item.label}
            {...item}
            collapsed={collapsed}
          />
        ))}
      </CollapsiblePanel>
    </Collapsible>
  );
}

function ResizeHandle({
  column,
  onPointerDown,
  onKeyDown,
}: {
  column: string;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      aria-label={`Resize ${column} column`}
      className="group absolute top-0 right-0 z-30 h-full w-2.5 translate-x-1/2 touch-none cursor-col-resize rounded-none p-0 hover:bg-transparent active:scale-100 focus-visible:outline-offset-[-2px]"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      size="icon-sm"
      variant="link"
    >
      <span className="h-full w-0.5 transition-colors group-hover:bg-[var(--hui-color-border-accent-emphasis)] group-focus-visible:bg-[var(--hui-color-border-accent-emphasis)] motion-reduce:transition-none" />
    </Button>
  );
}

export function CrmCustomerList() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clientWorkOpen, setClientWorkOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const measuredColumnWidths = () =>
    Array.from(
      tableViewportRef.current?.querySelectorAll<HTMLTableCellElement>(
        "[data-slot=table-head]",
      ) ?? [],
      (header) => header.getBoundingClientRect().width,
    );

  const updateColumnWidth = (index: number, nextWidth: number) => {
    setColumnWidths((current) => {
      const widths = current ?? measuredColumnWidths();
      return widths.map((width, widthIndex) =>
        widthIndex === index ? Math.max(80, nextWidth) : width,
      );
    });
  };

  const startColumnResize = (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    resizeCleanupRef.current?.();

    const widths = measuredColumnWidths();
    const startX = event.pageX;
    const startWidth = widths[index];
    setColumnWidths(widths);

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateColumnWidth(index, startWidth + moveEvent.pageX - startX);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      resizeCleanupRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
    resizeCleanupRef.current = cleanup;
    event.preventDefault();
  };

  const resizeColumnWithKeyboard = (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const widths = columnWidths ?? measuredColumnWidths();
    const direction = event.key === "ArrowLeft" ? -10 : 10;
    updateColumnWidth(index, widths[index] + direction);
    event.preventDefault();
  };

  const tableWidth = columnWidths
    ? `${columnWidths.reduce((total, width) => total + width, 0)}px`
    : "100%";

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] antialiased [font-family:var(--hui-font-body)]">
      <aside
        aria-label="Workspace navigation"
        className={cn(
          "hidden h-full w-[208px] shrink-0 flex-col border-r-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] motion-safe:transition-[width] motion-safe:duration-200 md:flex",
          sidebarCollapsed && "w-[68px]",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-full flex-row items-center gap-1 p-2",
            sidebarCollapsed && "justify-center",
          )}
        >
          {!sidebarCollapsed && (
            <Button
              className="h-8 min-w-0 flex-1 justify-start gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-2)]"
              variant="link"
            >
              <ColorAvatar color="mint" square />
              <span className="truncate">Daybreak</span>
              <ChevronsUpDown
                aria-hidden="true"
                className="ml-auto size-3 text-[var(--hui-color-foreground-base-tertiary)]"
              />
            </Button>
          )}
          <Button
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="mx-auto size-8 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-tertiary)]"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            size="icon"
            variant="link"
          >
            <PanelLeft aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden p-3 pt-2 pb-2">
          <div className="flex w-full flex-col gap-1">
            {MAIN_NAV_ITEMS.map((item) => (
              <NavigationItem key={item.label} {...item} collapsed={sidebarCollapsed} />
            ))}
          </div>

          <NavigationSection
            label="Client work"
            items={COMPANY_NAV_ITEMS}
            collapsed={sidebarCollapsed}
            open={clientWorkOpen}
            onOpenChange={setClientWorkOpen}
          />

          <NavigationSection
            label="Operations"
            items={SPACE_NAV_ITEMS}
            collapsed={sidebarCollapsed}
            open={operationsOpen}
            onOpenChange={setOperationsOpen}
            className="mt-2"
          />
        </div>

        <div
          data-example-footer="profile"
          className={cn(
            "flex h-11 shrink-0 items-center gap-[var(--hui-space-2)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-3)]",
            sidebarCollapsed && "justify-center",
          )}
        >
          <Button
            aria-label={sidebarCollapsed ? "Connor Love" : undefined}
            className={cn(
              "h-7 min-w-0 flex-1 justify-start gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] hover:bg-transparent",
              sidebarCollapsed && "flex-none justify-center px-0",
            )}
            variant="link"
          >
            <ColorAvatar color="purple" />
            <span className={cn("truncate", sidebarCollapsed && "hidden")}>Connor Love</span>
          </Button>
          {!sidebarCollapsed && (
            <Button
              aria-label="Profile options"
              className="size-8 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-tertiary)]"
              size="icon"
              variant="link"
            >
              <GripHorizontal aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </aside>

      <main className="flex h-full min-w-0 flex-1 flex-col bg-[var(--hui-color-background-base-primary)]">
        <header className="no-scrollbar flex h-12 shrink-0 items-center justify-between overflow-x-auto border-b-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
          <div className="flex items-center gap-2">
            <Button
              aria-label="Open navigation"
              className="size-8 p-[var(--hui-space-3)] md:hidden"
              size="icon"
              variant="link"
            >
              <Menu aria-hidden="true" className="size-4" />
            </Button>
            <div className="flex shrink-0 items-center gap-2 rounded-md px-2 py-2">
              <Users aria-hidden="true" className="size-4 text-[var(--hui-color-foreground-base-secondary)]" />
              <span className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]">Clients</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <Plus aria-hidden="true" className="size-4" />
              <span className="hidden sm:block">New client</span>
            </Button>
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <Share2 aria-hidden="true" className="size-4" />
              <span className="hidden sm:block">Share</span>
            </Button>
            <Separator orientation="vertical" className="mx-1 h-[18px]" />
            <AvatarGroup
              aria-hidden="true"
              className="mr-2 [--avatar-overlap:0.75rem]"
            >
              <ColorAvatar color="sky" />
              <ColorAvatar color="orange" />
              <ColorAvatar color="mint" />
            </AvatarGroup>
            <Separator orientation="vertical" className="mx-1 h-[18px]" />
            <Button
              aria-label="Help"
              className="size-8 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-tertiary)]"
              size="icon"
              variant="link"
            >
              <CircleQuestionMark aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </header>

        <div className="no-scrollbar flex h-12 shrink-0 items-center justify-between overflow-x-auto border-b-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
          <div className="flex shrink-0 items-center gap-1">
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              <span>Filters (0)</span>
            </Button>
            <Button
              aria-label="Add filter"
              className="size-7 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-tertiary)]"
              size="icon-sm"
              variant="link"
            >
              <Plus aria-hidden="true" className="size-4" />
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <LayoutGrid aria-hidden="true" className="size-4" />
              <span className="hidden sm:block">Fields</span>
            </Button>
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <ArrowUpDown aria-hidden="true" className="size-4" />
              <span className="hidden sm:block">Order</span>
            </Button>
            <Button className={ACTION_BUTTON_CLASS} variant="link">
              <Settings aria-hidden="true" className="size-4" />
              <span className="hidden lg:block">View options</span>
            </Button>
            <Separator
              orientation="vertical"
              className="mx-1 hidden h-[18px] sm:block"
            />
            <Button
              aria-label="Save client view"
              className="hidden size-8 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-tertiary)] sm:inline-flex"
              size="icon"
              variant="link"
            >
              <Save aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div
          ref={tableViewportRef}
          className="no-scrollbar relative flex min-h-0 flex-1 overflow-auto [&>[data-slot=table-container]]:contents"
        >
          <Table
            aria-label="Client accounts"
            className="table-fixed border-separate border-spacing-0"
            style={{ minWidth: "900px", width: tableWidth }}
          >
            <colgroup>
              {HEADER_COLUMNS.map((column, index) => (
                <col
                  key={column.label}
                  style={{ width: columnWidths?.[index] ?? "20%" }}
                />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-20">
              <TableRow>
                {HEADER_COLUMNS.map(({ label, icon: Icon }, index) => (
                  <TableHead
                    key={label}
                    className={cn(
                      "relative h-11 min-w-20 p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]",
                      index < HEADER_COLUMNS.length - 1 &&
                        "border-r-[0.5px] border-r-[var(--hui-color-border-base-primary)]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-3)]">
                      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
                      <span className="truncate">{label}</span>
                    </div>
                    <ResizeHandle
                      column={label}
                      onPointerDown={(event) => startColumnResize(index, event)}
                      onKeyDown={(event) => resizeColumnWithKeyboard(index, event)}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {CLIENT_ROWS.map((row) => (
                <TableRow
                  key={row.company}
                  className="group motion-reduce:transition-none"
                  interactive
                >
                  <TableCell className="h-11 min-w-0 border-r-[0.5px] border-r-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-3)]">
                      <ColorAvatar color={row.accountColor} square />
                      <span className="truncate">{row.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="h-11 min-w-0 border-r-[0.5px] border-r-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
                      <div className="flex min-w-0 flex-1 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-3)]">
                        <ColorAvatar color={row.teamColors[0]} />
                        <span className="truncate">{row.contact}</span>
                      </div>
                      <GripVertical
                        aria-hidden="true"
                        className="size-4 shrink-0 cursor-grab text-[var(--hui-color-foreground-base-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="h-11 min-w-0 border-r-[0.5px] border-r-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
                      <AvatarGroup
                        aria-hidden="true"
                        className="min-w-0 flex-1 px-[var(--hui-space-3)] py-[var(--hui-space-3)] [--avatar-overlap:0.75rem]"
                      >
                        {row.teamColors.map((color) => (
                          <ColorAvatar key={color} color={color} />
                        ))}
                      </AvatarGroup>
                      <GripVertical
                        aria-hidden="true"
                        className="size-4 shrink-0 cursor-grab text-[var(--hui-color-foreground-base-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="h-11 min-w-0 border-r-[0.5px] border-r-[var(--hui-color-border-base-primary)] p-[var(--hui-space-3)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-3)]">
                      <DollarSign
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
                      />
                      <span className="truncate">
                        {row.annualValueLabel}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="h-11 min-w-0 p-[var(--hui-space-3)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-3)]">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
                      />
                      <span className="truncate">{row.startDate}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="sticky bottom-0 z-20">
              <TableRow
                data-example-footer="summary"
                className="h-11 bg-[var(--hui-color-background-base-secondary)]"
              >
                {[
                  `Total: ${CLIENTS.length} clients`,
                  "Count",
                  "Count",
                  `Sum: ${currencyFormatter.format(TOTAL_ANNUAL_VALUE)}`,
                  "Count",
                ].map((summary, index) => (
                  <TableCell
                    key={`${summary}-${index}`}
                    className={cn(
                      "h-11 min-w-0 border-t-[0.5px] border-b-0 border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-0 text-[var(--hui-color-foreground-base-secondary)]",
                      index < HEADER_COLUMNS.length - 1 && "border-r-[0.5px]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
                      <ListOrdered
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
                      />
                      <span className="truncate">{summary}</span>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </main>
    </div>
  );
}
