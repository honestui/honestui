import {
  BarChartIcon,
  ChartStackedAreaIcon,
  ChartStackedLineIcon,
  HeatmapIcon,
  PieChartIcon,
  ScatterChartIcon,
} from "@/assets/icons";
import {
  ActivitySparkIcon,
  Alert02Icon,
  ArrangeByNumbersOneNineIcon,
  ArrowDataTransferHorizontalIcon,
  BadgeIcon,
  BrowserIcon,
  BounceRightIcon,
  BubbleChatIcon,
  CardExchangeIcon,
  CheckmarkSquare02Icon,
  CollapseIcon,
  ColorPickerIcon,
  CreditCardIcon,
  CursorPointer02Icon,
  CustomFieldIcon,
  DashboardSquare01Icon,
  DockIcon,
  DropdownFieldTypeIcon,
  FileEmpty02Icon,
  FormIcon,
  FrameIcon,
  GroupItemsIcon,
  InputLongTextIcon,
  InputNumericIcon,
  InputShortTextIcon,
  KanbanIcon,
  Layers01Icon,
  Layout02Icon,
  LayoutTable01Icon,
  LayoutTopIcon,
  Loading03Icon,
  MagicWand01Icon,
  MagnetIcon,
  Menu01Icon,
  Menu02Icon,
  Message01Icon,
  MinusSignIcon,
  MoreHorizontalCircle01Icon,
  Navigation03Icon,
  Notification02Icon,
  PanelRightIcon,
  RadioButtonIcon,
  RotateSquareIcon,
  ScrollHorizontalIcon,
  ScrollVerticalIcon,
  Select02Icon,
  SlidersHorizontalIcon,
  Table01Icon,
  Tag01Icon,
  TextColorIcon,
  TextSelectionIcon,
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
  "color-picker": ColorPickerIcon,
  dialog: BrowserIcon,
  empty: FileEmpty02Icon,
  field: CustomFieldIcon,
  fieldset: LayoutTable01Icon,
  form: FormIcon,
  frame: FrameIcon,
  group: GroupItemsIcon,
  input: InputShortTextIcon,
  "kanban-list": KanbanIcon,
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

const ANIMATED_COMPONENT_ICONS = {
  "action-swap": ArrowDataTransferHorizontalIcon,
  "bouncy-accordion": BounceRightIcon,
  "chromatic-text-reveal": TextColorIcon,
  dock: DockIcon,
  magnetic: MagnetIcon,
  marquee: ScrollHorizontalIcon,
  "number-ticker": ArrangeByNumbersOneNineIcon,
  "shared-layout-bg": Layers01Icon,
  "text-reveal": TextSelectionIcon,
  "text-shimmer": ActivitySparkIcon,
  "tilt-card": RotateSquareIcon,
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
    case "pie-chart":
      return <PieChartIcon />;
    case "heatmap":
      return <HeatmapIcon />;
    case "scatter-chart":
      return <ScatterChartIcon />;
  }

  const componentIcon = COMPONENT_ICONS[item as keyof typeof COMPONENT_ICONS];

  if (componentIcon) {
    return <HugeiconsIcon icon={componentIcon} strokeWidth={1.5} />;
  }

  const animatedIcon =
    ANIMATED_COMPONENT_ICONS[item as keyof typeof ANIMATED_COMPONENT_ICONS];

  return animatedIcon ? <HugeiconsIcon icon={animatedIcon} strokeWidth={1.5} /> : null;
}
