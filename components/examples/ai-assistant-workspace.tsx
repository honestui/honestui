"use client";

import {
  ArrowUp,
  BotMessageSquare,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  FileText,
  Folder,
  Mail,
  Menu,
  Mic,
  Moon,
  PanelLeft,
  Plug,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Users,
  WandSparkles,
} from "honestui/icons";
import { Dropbox, GoogleCalendar, Notion, Stripe } from "honestui/logos";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type IconComponent = React.ElementType;
type AvatarColor =
  | "indigo"
  | "mint"
  | "purple"
  | "orange"
  | "sky"
  | "cyan"
  | "gold";

interface NavigationItem {
  label: string;
  icon: IconComponent;
  current?: boolean;
}

interface Assistant {
  name: string;
  color: AvatarColor;
}

interface SuggestedApplication {
  name: string;
  description: string;
  logo: IconComponent;
  logoClassName?: string;
}

const PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: "Assistants", icon: BotMessageSquare, current: true },
];

const WORKSPACE_NAVIGATION: NavigationItem[] = [
  { label: "Contacts", icon: Users },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Files", icon: Folder },
  { label: "Connections", icon: Plug },
];

const ASSISTANTS: Assistant[] = [
  { name: "Scout", color: "indigo" },
  { name: "Atlas", color: "mint" },
  { name: "Scribe", color: "purple" },
  { name: "Relay", color: "orange" },
  { name: "Beacon", color: "sky" },
];

const SUGGESTED_PROMPTS = [
  { label: "Plan my week", icon: Calendar },
  { label: "Summarize project brief", icon: FileText },
  { label: "Draft client update", icon: Mail },
];

const RECENT_CONVERSATIONS = [
  {
    title: "Prepare the Harborview launch brief",
    assistants: [ASSISTANTS[0]],
  },
  {
    title: "Summarize feedback from the design review",
    assistants: [ASSISTANTS[0], ASSISTANTS[2]],
  },
  {
    title: "Draft follow-ups for renewal conversations",
    assistants: [ASSISTANTS[0], ASSISTANTS[1], ASSISTANTS[3]],
  },
  {
    title: "Compare July pipeline changes",
    assistants: [ASSISTANTS[0], ASSISTANTS[1], ASSISTANTS[4]],
  },
];

const SUGGESTED_APPLICATIONS: SuggestedApplication[] = [
  {
    name: "Stripe MCP",
    description: "Review payments, invoices, and revenue activity from one workspace.",
    logo: Stripe,
  },
  {
    name: "Google Calendar",
    description: "Coordinate meetings, deadlines, and availability across projects.",
    logo: GoogleCalendar,
  },
  {
    name: "Notion",
    description: "Bring project notes, briefs, and decisions into shared context.",
    logo: Notion,
    logoClassName: "text-black",
  },
  {
    name: "Dropbox",
    description: "Find shared files and reference the latest project documents.",
    logo: Dropbox,
  },
];

function AssistantAvatar({
  assistant,
  size = "2",
}: {
  assistant: Assistant;
  size?: "2" | "3" | "4";
}) {
  return (
    <Avatar color={assistant.color} shape="rounded" size={size} variant="soft">
      <AvatarFallback>{assistant.name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

function SidebarItem({
  item,
  collapsed,
}: {
  item: NavigationItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Button
      aria-current={item.current ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "h-8 w-full justify-start gap-[var(--hui-space-3)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
        item.current && "text-[var(--hui-color-foreground-base-primary)]",
        collapsed && "mx-auto size-8 justify-center p-0",
      )}
      title={collapsed ? item.label : undefined}
      variant={item.current ? "secondary" : "link"}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
    </Button>
  );
}

function SidebarSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavigationItem[];
  collapsed: boolean;
}) {
  return (
    <Collapsible defaultOpen className="flex w-full flex-col gap-[var(--hui-space-2)]">
      {!collapsed && (
        <CollapsibleTrigger className="group flex h-6 items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]">
          <span className="[font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
            {label}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-3 transition-transform group-data-panel-open:rotate-0 -rotate-90 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      )}
      <CollapsiblePanel className="flex flex-col gap-[var(--hui-space-1)]">
        {items.map((item) => (
          <SidebarItem collapsed={collapsed} item={item} key={item.label} />
        ))}
      </CollapsiblePanel>
    </Collapsible>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  hideLabel,
}: {
  icon: IconComponent;
  label: string;
  hideLabel?: boolean;
}) {
  return (
    <Button
      aria-label={hideLabel ? label : undefined}
      className="h-8 gap-[var(--hui-space-2)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]"
      size={hideLabel ? "icon" : "sm"}
      title={hideLabel ? label : undefined}
      variant="link"
    >
      <Icon aria-hidden="true" className="size-4" />
      {!hideLabel && <span>{label}</span>}
    </Button>
  );
}

export function AiAssistantWorkspace() {
  const { setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div
      className="relative flex h-dvh w-full overflow-hidden bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] antialiased [font-family:var(--hui-font-body)]"
      data-example="ai-assistant-workspace"
    >
      {mobileNavigationOpen && (
        <button
          aria-label="Dismiss navigation"
          className="fixed inset-0 z-40 bg-[var(--hui-color-overlay-base-a6)] md:hidden"
          onClick={() => setMobileNavigationOpen(false)}
          type="button"
        />
      )}

      <aside
        aria-label="Workspace navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[208px] shrink-0 flex-col overflow-hidden border-r-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] motion-safe:transition-[width] motion-safe:duration-200 md:static md:z-auto",
          !mobileNavigationOpen && "max-md:hidden",
          sidebarCollapsed && "w-[68px]",
        )}
      >
        <div className="flex h-12 shrink-0 items-center gap-[var(--hui-space-1)] p-[var(--hui-space-2)]">
          {!sidebarCollapsed && (
            <Button
              className="h-8 min-w-0 flex-1 justify-start gap-[var(--hui-space-3)] px-[var(--hui-space-3)]"
              variant="link"
            >
              <AssistantAvatar assistant={{ name: "Morrow", color: "cyan" }} />
              <span className="min-w-0 flex-1 truncate text-left">Morrow</span>
              <ChevronDown aria-hidden="true" className="size-3" />
            </Button>
          )}
          <Button
            aria-label="Close navigation"
            className="size-8 shrink-0 p-0 md:hidden"
            onClick={() => setMobileNavigationOpen(false)}
            size="icon"
            variant="link"
          >
            <PanelLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-8 shrink-0 p-0 md:inline-flex"
            onClick={() => setSidebarCollapsed((current) => !current)}
            size="icon"
            variant="link"
          >
            <PanelLeft aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[var(--hui-space-5)] overflow-y-auto px-[var(--hui-space-2)] py-[var(--hui-space-3)]">
          <Button
            aria-label={sidebarCollapsed ? "Search" : undefined}
            className={cn(
              "h-8 w-full justify-start gap-[var(--hui-space-3)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] shadow-none",
              sidebarCollapsed && "mx-auto size-8 justify-center border-transparent p-0",
            )}
            variant="outline"
          >
            <Search aria-hidden="true" className="size-4 shrink-0" />
            {!sidebarCollapsed && <span className="min-w-0 flex-1 truncate text-left">Search</span>}
          </Button>

          <nav aria-label="Primary" className="flex flex-col gap-[var(--hui-space-1)]">
            {PRIMARY_NAVIGATION.map((item) => (
              <SidebarItem collapsed={sidebarCollapsed} item={item} key={item.label} />
            ))}
          </nav>

          <SidebarSection
            collapsed={sidebarCollapsed}
            items={WORKSPACE_NAVIGATION}
            label="Workspace"
          />

          <div className="mt-auto">
            <div className={cn("flex items-center gap-[var(--hui-space-1)]", sidebarCollapsed && "flex-col")}>
              <Button
                aria-label={sidebarCollapsed ? "Connor Love" : undefined}
                className={cn(
                  "h-8 min-w-0 flex-1 justify-start gap-[var(--hui-space-3)] px-[var(--hui-space-3)]",
                  sidebarCollapsed && "size-8 flex-none justify-center p-0",
                )}
                variant="link"
              >
                <Avatar color="purple" shape="full" size="2" variant="soft">
                  <AvatarFallback>CL</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && <span className="truncate">Connor Love</span>}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--hui-color-background-base-primary)]">
        <header className="flex h-12 shrink-0 items-center justify-between gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-2)]">
          <div className="flex min-w-0 items-center gap-[var(--hui-space-1)]">
            <Button
              aria-label="Open navigation"
              className="size-8 p-0 md:hidden"
              onClick={() => setMobileNavigationOpen(true)}
              size="icon"
              variant="link"
            >
              <Menu aria-hidden="true" className="size-4" />
            </Button>
            <Button className="h-8 gap-[var(--hui-space-3)] px-[var(--hui-space-3)]" variant="link">
              <AssistantAvatar assistant={ASSISTANTS[0]} />
              <span>Ask Scout</span>
            </Button>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-[var(--hui-space-1)]">
            <Button
              className="hidden h-8 gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] sm:inline-flex"
              size="sm"
              variant="link"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              New session
            </Button>
            <Button
              aria-label="Toggle color theme"
              className="size-8 p-0"
              onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
              size="icon"
              variant="link"
            >
              <Sun aria-hidden="true" className="size-4 dark:hidden" />
              <Moon aria-hidden="true" className="hidden size-4 dark:block" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center gap-12 px-[var(--hui-space-5)] py-10 md:px-10 md:py-12 lg:gap-16">
            <section aria-labelledby="assistant-greeting" className="flex w-full max-w-[760px] flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-[var(--hui-space-3)] text-center">
                <h1
                  className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-title)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-title)] [line-height:var(--hui-line-height-title)]"
                  id="assistant-greeting"
                >
                  Good morning, Connor
                </h1>
                <p className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
                  I’m Scout. What should we work on first?
                </p>
              </div>

              <div className="flex w-full flex-col gap-[var(--hui-space-5)]">
                <Card className="gap-0 overflow-hidden py-0" variant="outline">
                  <CardPanel className="p-[var(--hui-space-3)] pb-0">
                    <label className="sr-only" htmlFor="assistant-prompt">
                      Message Scout
                    </label>
                    <Textarea
                      className="min-h-20 resize-none border-transparent bg-transparent shadow-none"
                      id="assistant-prompt"
                      placeholder="Example: Summarize the Harborview kickoff notes and draft next steps…"
                      variant="borderless"
                    />
                  </CardPanel>
                  <div className="flex flex-wrap items-center justify-between gap-[var(--hui-space-3)] p-[var(--hui-space-3)] pt-[var(--hui-space-2)]">
                    <div className="flex min-w-0 items-center gap-[var(--hui-space-1)]">
                      <ToolbarButton hideLabel icon={Plus} label="Add attachment" />
                      <ToolbarButton icon={WandSparkles} label="Skills" />
                    </div>
                    <div className="ml-auto flex items-center gap-[var(--hui-space-2)]">
                      <ToolbarButton hideLabel icon={Mic} label="Use voice input" />
                      <Button aria-label="Send prompt" className="size-8 p-0" size="icon">
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                <div aria-label="Suggested prompts" className="flex w-full flex-wrap gap-[var(--hui-space-2)] pb-[var(--hui-space-1)]">
                  {SUGGESTED_PROMPTS.map(({ label, icon: Icon }) => (
                    <Button
                      className="h-8 gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]"
                      key={label}
                      size="sm"
                      variant="outline"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex w-full flex-col gap-12">
              <section aria-labelledby="recent-conversations-heading" className="flex flex-col gap-[var(--hui-space-5)]">
                <div className="flex flex-wrap items-center gap-[var(--hui-space-2)]">
                  <h2
                    className="min-w-0 flex-1 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-small)]"
                    id="recent-conversations-heading"
                  >
                    Recent conversations (48)
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-[var(--hui-space-3)] sm:grid-cols-2 lg:grid-cols-4">
                  {RECENT_CONVERSATIONS.map((conversation) => (
                    <Card className="min-h-[88px] gap-[var(--hui-space-3)] p-[var(--hui-space-4)] py-[var(--hui-space-4)]" key={conversation.title} variant="outline">
                      <AvatarGroup aria-label={`Assistants in ${conversation.title}`}>
                        {conversation.assistants.map((assistant) => (
                          <AssistantAvatar assistant={assistant} key={assistant.name} />
                        ))}
                      </AvatarGroup>
                      <p className="line-clamp-2 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-mini)]">
                        {conversation.title}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>

              <section aria-labelledby="suggested-applications-heading" className="flex flex-col gap-[var(--hui-space-5)] pb-8">
                <div className="flex flex-wrap items-center gap-[var(--hui-space-2)]">
                  <h2
                    className="min-w-0 flex-1 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-small)]"
                    id="suggested-applications-heading"
                  >
                    Suggested applications
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-[var(--hui-space-3)] sm:grid-cols-2 lg:grid-cols-4">
                  {SUGGESTED_APPLICATIONS.map(({ name, description, logo: Logo, logoClassName }) => (
                    <Card className="min-h-[116px] gap-[var(--hui-space-3)] p-[var(--hui-space-4)] py-[var(--hui-space-4)]" key={name} variant="outline">
                      <CardHeader className="flex grid-cols-none grid-rows-none flex-row items-center gap-[var(--hui-space-3)] p-0">
                        <span
                          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)]"
                          data-application-logo={name}
                        >
                          <Logo
                            aria-hidden="true"
                            className={cn("size-6", logoClassName)}
                            focusable="false"
                          />
                        </span>
                        <CardTitle className="min-w-0 flex-1 truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [line-height:var(--hui-line-height-small)]">
                          {name}
                        </CardTitle>
                      </CardHeader>
                      <CardDescription className="line-clamp-2 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)]">
                        {description}
                      </CardDescription>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
