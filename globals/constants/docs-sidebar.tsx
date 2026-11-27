import {
  AddMagicIcon,
  BrushIcon,
  ChartConfigIcon,
  ChartLegendIcon,
  CheckIcon,
  DotsIcon,
  HouseIcon,
  ShapesIcon,
  SquareAddonIcon,
  TooltipIcon,
} from "@/assets/icons";
interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export const ChartStartedOptions: SidebarOption[] = [
  {
    name: "Get Started",
    url: "/docs/charts",
    icon: <HouseIcon />,
  },
  {
    name: "Installation",
    url: "/docs/charts/installation",
    icon: <SquareAddonIcon />,
  },
];

export const ChartComponentOptions: SidebarOption[] = [
  {
    name: "Tooltip",
    url: "/docs/charts/ui/tooltip",
    icon: <TooltipIcon />,
  },
  {
    name: "Legend",
    url: "/docs/charts/ui/legend",
    icon: <ChartLegendIcon />,
  },
  {
    name: "Dots",
    url: "/docs/charts/ui/dots",
    icon: <DotsIcon />,
  },
  {
    name: "Brush",
    url: "/docs/charts/ui/brush",
    icon: <BrushIcon />,
  },
];

export const DocumentationOptions: SidebarOption[] = [
  {
    name: "Chart Config",
    url: "/docs/charts/chart-config",
    icon: <ChartConfigIcon />,
  },
  {
    name: "Data Status",
    url: "/docs/charts/data-status",
    icon: <CheckIcon />,
  },
];

export const ChartHonestyOptions: SidebarOption[] = [
  {
    name: "Honest Charts",
    url: "/docs/charts/honesty",
    icon: <CheckIcon />,
  },
  {
    name: "Partial Period",
    url: "/docs/charts/honesty/partial-period",
    icon: <ChartConfigIcon />,
  },
  {
    name: "Confidence Bands",
    url: "/docs/charts/honesty/confidence-bands",
    icon: <ChartConfigIcon />,
  },
  {
    name: "Data Gaps",
    url: "/docs/charts/honesty/data-gaps",
    icon: <ChartConfigIcon />,
  },
  {
    name: "Truncated Axis",
    url: "/docs/charts/honesty/truncated-axis",
    icon: <ChartConfigIcon />,
  },
  {
    name: "Sample Size",
    url: "/docs/charts/honesty/sample-size",
    icon: <ChartConfigIcon />,
  },
];

export const IconStartedOptions: SidebarOption[] = [
  {
    name: "Installation",
    url: "/docs/icons/installation",
    icon: <SquareAddonIcon />,
  },
  {
    name: "Usage",
    url: "/docs/icons/usage",
    icon: <ShapesIcon />,
  },
  {
    name: "Accessibility",
    url: "/docs/icons/accessibility",
    icon: <CheckIcon />,
  },
];

export const AnimatedStartedOptions: SidebarOption[] = [
  {
    name: "Overview",
    url: "/docs/animated",
    icon: <AddMagicIcon />,
  },
  {
    name: "Installation",
    url: "/docs/animated/installation",
    icon: <SquareAddonIcon />,
  },
];

export const AiStartedOptions: SidebarOption[] = [
  {
    name: "Overview",
    url: "/docs/ai",
    icon: <AddMagicIcon />,
  },
  {
    name: "Installation",
    url: "/docs/ai/installation",
    icon: <SquareAddonIcon />,
  },
  {
    name: "Playground",
    url: "/docs/ai/generative/playground",
    icon: <ShapesIcon />,
  },
];

export const ProductStartedOptions: SidebarOption[] = [
  {
    name: "Overview",
    url: "/docs/product",
    icon: <HouseIcon />,
  },
];

export const ShaderStartedOptions: SidebarOption[] = [
  {
    name: "Overview",
    url: "/docs/shaders",
    icon: <AddMagicIcon />,
  },
  {
    name: "Installation",
    url: "/docs/shaders/installation",
    icon: <SquareAddonIcon />,
  },
];

export const ExampleOptions: SidebarOption[] = [
  {
    name: "Overview",
    url: "/docs/examples",
    icon: <HouseIcon />,
  },
];

// Pages reachable from the grouped links above; NavMain skips them so they do
// not appear twice in the chart-family list.
export const EXCLUDED_PAGE_SUFFIXES: string[] = ["/installation", "/changelog"];

export function isExcludedPage(url: string): boolean {
  return EXCLUDED_PAGE_SUFFIXES.some((suffix) => url.endsWith(suffix));
}
