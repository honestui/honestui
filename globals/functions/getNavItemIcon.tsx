import {
  BarChartIcon,
  BarListIcon,
  BulletChartIcon,
  CandlestickChartIcon,
  CategoryBarIcon,
  ChartStackedAreaIcon,
  ChartStackedLineIcon,
  ComboChartIcon,
  ContributionGraphIcon,
  FunnelChartIcon,
  GaugeChartIcon,
  HeatmapIcon,
  PieChartIcon,
  RadarChartIcon,
  RadialChartIcon,
  SankeyChartIcon,
  ScatterChartIcon,
  SparklineIcon,
  TrackerIcon,
  TreemapIcon,
  WaterfallChartIcon,
} from "@/assets/icons";
import {
  ActivitySparkIcon,
  Alert02Icon,
  AlertSquareIcon,
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
  CommandLineIcon,
  CreditCardIcon,
  CursorPointer02Icon,
  CustomFieldIcon,
  DashboardSquare01Icon,
  DistributeVerticalCenterIcon,
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
  MouseRightClick02Icon,
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
  Calendar03Icon,
  CarouselHorizontalIcon,
  LayoutBottomIcon,
  PasswordValidationIcon,
  MenuSquareIcon,
  Navigation01Icon,
  LayoutTwoColumnIcon,
  Loading01Icon,
  CropIcon,
  ArrowExpandIcon,
  ArrowLeftRightIcon,
  BlurIcon,
  BorderAllIcon,
  Comet01Icon,
  FlowConnectionIcon,
  Grid02Icon,
  Notification03Icon,
  Orbit01Icon,
  PartyIcon,
  ProgressIcon,
  RepeatIcon,
  ShuffleIcon,
  SparklesIcon,
  SpotlightIcon,
  TypeCursorIcon,
  ViewIcon,
  CardsIcon,
  CheckmarkCircle02Icon,
  DragDropVerticalIcon,
  FastWindIcon,
  Image01Icon,
  LiveStreaming01Icon,
  PinIcon,
  RotateClockwiseIcon,
  SplitIcon,
  Touch01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const COMPONENT_ICONS = {
  accordion: Menu01Icon,
  alert: Alert02Icon,
  "alert-dialog": AlertSquareIcon,
  "aspect-ratio": CropIcon,
  autocomplete: MagicWand01Icon,
  avatar: UserCircleIcon,
  badge: BadgeIcon,
  breadcrumb: Navigation03Icon,
  button: CursorPointer02Icon,
  calendar: Calendar03Icon,
  card: CreditCardIcon,
  carousel: CarouselHorizontalIcon,
  checkbox: CheckmarkSquare02Icon,
  collapsible: CollapseIcon,
  "color-picker": ColorPickerIcon,
  combobox: DropdownFieldTypeIcon,
  command: CommandLineIcon,
  "context-menu": MouseRightClick02Icon,
  density: DistributeVerticalCenterIcon,
  dialog: BrowserIcon,
  drawer: LayoutBottomIcon,
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
  menubar: MenuSquareIcon,
  meter: DashboardSquare01Icon,
  "native-select": Select02Icon,
  "navigation-menu": Navigation01Icon,
  "number-field": InputNumericIcon,
  "otp-field": PasswordValidationIcon,
  pagination: MoreHorizontalCircle01Icon,
  popover: Message01Icon,
  "preview-card": CardExchangeIcon,
  progress: Loading03Icon,
  "radio-group": RadioButtonIcon,
  resizable: LayoutTwoColumnIcon,
  "scroll-area": ScrollVerticalIcon,
  select: Select02Icon,
  separator: MinusSignIcon,
  sheet: PanelRightIcon,
  skeleton: Layout02Icon,
  slider: SlidersHorizontalIcon,
  spinner: Loading01Icon,
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
  "animated-beam": FlowConnectionIcon,
  "animated-list": Notification03Icon,
  "animated-tabs": LayoutTopIcon,
  "border-beam": BorderAllIcon,
  confetti: PartyIcon,
  "grid-pattern": Grid02Icon,
  "in-view": ViewIcon,
  meteors: Comet01Icon,
  "morphing-dialog": ArrowExpandIcon,
  "orbiting-circles": Orbit01Icon,
  "progressive-blur": BlurIcon,
  "scroll-progress": ProgressIcon,
  "shine-border": SparklesIcon,
  spotlight: SpotlightIcon,
  "text-scramble": ShuffleIcon,
  "transition-panel": ArrowLeftRightIcon,
  typewriter: TypeCursorIcon,
  "word-rotate": RepeatIcon,
  "hold-to-confirm": Touch01Icon,
  "status-pill": LiveStreaming01Icon,
  "compare-slider": SplitIcon,
  "reorder-list": DragDropVerticalIcon,
  "success-check": CheckmarkCircle02Icon,
  "card-stack": CardsIcon,
  "sticky-scroll-reveal": PinIcon,
  "image-trail": Image01Icon,
  "circular-text": RotateClockwiseIcon,
  "scroll-velocity-text": FastWindIcon,
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
    case "sparkline":
      return <SparklineIcon />;
    case "radar-chart":
      return <RadarChartIcon />;
    case "radial-chart":
      return <RadialChartIcon />;
    case "gauge-chart":
      return <GaugeChartIcon />;
    case "bar-list":
      return <BarListIcon />;
    case "tracker":
      return <TrackerIcon />;
    case "category-bar":
      return <CategoryBarIcon />;
    case "combo-chart":
      return <ComboChartIcon />;
    case "waterfall-chart":
      return <WaterfallChartIcon />;
    case "candlestick-chart":
      return <CandlestickChartIcon />;
    case "bullet-chart":
      return <BulletChartIcon />;
    case "funnel-chart":
      return <FunnelChartIcon />;
    case "treemap":
      return <TreemapIcon />;
    case "sankey-chart":
      return <SankeyChartIcon />;
    case "contribution-graph":
      return <ContributionGraphIcon />;
  }

  const componentIcon = COMPONENT_ICONS[item as keyof typeof COMPONENT_ICONS];

  if (componentIcon) {
    return <HugeiconsIcon icon={componentIcon} strokeWidth={1.5} />;
  }

  const animatedIcon =
    ANIMATED_COMPONENT_ICONS[item as keyof typeof ANIMATED_COMPONENT_ICONS];

  return animatedIcon ? <HugeiconsIcon icon={animatedIcon} strokeWidth={1.5} /> : null;
}
