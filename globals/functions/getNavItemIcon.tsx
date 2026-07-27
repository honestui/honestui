import {
  BarChartIcon,
  ChartStackedAreaIcon,
  ChartStackedLineIcon,
  ComposedChartIcon,
  PieChartIcon,
  RadialChartIcon,
  RadarChartIcon,
  SankeyChartIcon,
} from "@/assets/icons";
import {
  Alert02Icon,
  BadgeIcon,
  BrowserIcon,
  BubbleChatIcon,
  CardExchangeIcon,
  CheckmarkSquare02Icon,
  CollapseIcon,
  CreditCardIcon,
  CursorPointer02Icon,
  CustomFieldIcon,
  DashboardSquare01Icon,
  DropdownFieldTypeIcon,
  FileEmpty02Icon,
  FormIcon,
  FrameIcon,
  GroupItemsIcon,
  InputLongTextIcon,
  InputNumericIcon,
  InputShortTextIcon,
  Layout02Icon,
  LayoutTable01Icon,
  LayoutTopIcon,
  Loading03Icon,
  MagicWand01Icon,
  Menu01Icon,
  Menu02Icon,
  Message01Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  Navigation03Icon,
  Notification02Icon,
  PanelRightIcon,
  RadioButtonIcon,
  ScrollVerticalIcon,
  Select02Icon,
  SlidersHorizontalIcon,
  Table01Icon,
  Tag01Icon,
  ToggleOffIcon,
  ToggleOnIcon,
  ToolsIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const COMPONENT_ICONS = {
  accordion: Menu01Icon,
  alert: Alert02Icon,
  autocomplete: MagicWand01Icon,
  avatar: UserCircleIcon,
  badge: BadgeIcon,
  breadcrumb: Navigation03Icon,
  button: CursorPointer02Icon,
  card: CreditCardIcon,
  checkbox: CheckmarkSquare02Icon,
  collapsible: CollapseIcon,
  combobox: DropdownFieldTypeIcon,
  dialog: BrowserIcon,
  empty: FileEmpty02Icon,
  field: CustomFieldIcon,
  fieldset: LayoutTable01Icon,
  form: FormIcon,
  frame: FrameIcon,
  group: GroupItemsIcon,
  input: InputShortTextIcon,
  label: Tag01Icon,
  menu: Menu02Icon,
  meter: DashboardSquare01Icon,
  "number-field": InputNumericIcon,
  pagination: MoreHorizontalCircle01Icon,
  popover: Message01Icon,
  "preview-card": CardExchangeIcon,
  progress: Loading03Icon,
  "radio-group": RadioButtonIcon,
  "scroll-area": ScrollVerticalIcon,
  select: Select02Icon,
  separator: MinusSignIcon,
  sheet: PanelRightIcon,
  skeleton: Layout02Icon,
  slider: SlidersHorizontalIcon,
  switch: ToggleOnIcon,
  table: Table01Icon,
  tabs: LayoutTopIcon,
  textarea: InputLongTextIcon,
  toast: Notification02Icon,
  toggle: ToggleOffIcon,
  toolbar: ToolsIcon,
  tooltip: BubbleChatIcon,
} as const;

// Custom icons for each item in the sidebar of MDX files.
// Folder ids arrive as `root:<path>` where path is relative to the content root, // `root:recharts/area-chart`, `root:echarts/area-chart`, … Matching on the last
// path segment keeps one case per chart type across every provider.
export function getNavItemIcon(tag?: string) {
  const item = tag?.replace(/^root:/, "").split("/").pop();

  switch (item) {
    case "area-chart":
      return <ChartStackedAreaIcon />;
    case "line-chart":
      return <ChartStackedLineIcon />;
    case "bar-chart":
      return <BarChartIcon />;
    case "composed-chart":
      return <ComposedChartIcon />;
    case "pie-chart":
      return <PieChartIcon />;
    case "radial-chart":
      return <RadialChartIcon />;
    case "radar-chart":
      return <RadarChartIcon />;
    case "sankey-chart":
      return <SankeyChartIcon />;
  }

  const componentIcon = COMPONENT_ICONS[item as keyof typeof COMPONENT_ICONS];

  return componentIcon ? <HugeiconsIcon icon={componentIcon} strokeWidth={1.5} /> : null;
}
