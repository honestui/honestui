"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Water treatment stages
const data: SankeyData = {
  nodes: [
    { name: "CRT_L" }, // Left CRT
    { name: "PPT_L" }, // Left PPT
    { name: "DMG_L" }, // Left DMG
    { name: "PPT_M" }, // Middle PPT
    { name: "DMG_M" }, // Middle DMG
    { name: "CRT_R" }, // Right CRT
    { name: "PPT_R" }, // Right PPT
    { name: "DMG_R" }, // Right DMG
  ],
  links: [
    // From left CRT to middle nodes
    { source: 0, target: 3, value: 1600 },
    { source: 0, target: 4, value: 1004 },

    // From left PPT to middle nodes
    { source: 1, target: 3, value: 3000 },
    { source: 1, target: 4, value: 2996 },

    // From left DMG to middle nodes
    { source: 2, target: 3, value: 7862 },
    { source: 2, target: 4, value: 3224 },

    // From middle PPT to right nodes
    { source: 3, target: 5, value: 4000 },
    { source: 3, target: 6, value: 4182 },
    { source: 3, target: 7, value: 3680 },

    // From middle DMG to right nodes
    { source: 4, target: 5, value: 3982 },
    { source: 4, target: 7, value: 2316 },
  ],
};

const chartConfig = {
  CRT_L: {
    label: "Raw water",
    colors: {
      light: ["#a3a3a3"], // lighter than #525252
      dark: ["#525252"],
    },
  },
  PPT_L: {
    label: "Filtered",
    colors: {
      light: ["#d1b3ff"], // lighter than #8b5cf6
      dark: ["#8b5cf6"],
    },
  },
  DMG_L: {
    label: "Treated",
    colors: {
      light: ["#a3a3a3"], // lighter than #404040
      dark: ["#404040"],
    },
  },
  PPT_M: {
    label: "Filtered",
    colors: {
      light: ["#c4b5fd"], // lighter than #7c3aed
      dark: ["#7c3aed"],
    },
  },
  DMG_M: {
    label: "Treated",
    colors: {
      light: ["#67e8f9"], // lighter than #06b6d4
      dark: ["#06b6d4"],
    },
  },
  CRT_R: {
    label: "Raw water",
    colors: {
      light: ["#6ee7b7"], // lighter than #10b981
      dark: ["#10b981"],
    },
  },
  PPT_R: {
    label: "Filtered",
    colors: {
      light: ["#a3a3a3"], // lighter than #525252
      dark: ["#525252"],
    },
  },
  DMG_R: {
    label: "Treated",
    colors: {
      light: ["#a3a3a3"], // lighter than #404040
      dark: ["#404040"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      nodeWidth={80}
      nodePadding={24}
    >
      <SankeyChart.Node isClickable radius={4}>
        <SankeyChart.NodeLabel
          position="inside" // [!code highlight]
          valueFormatter={(value) => value.toLocaleString()}
        />
      </SankeyChart.Node>
      <SankeyChart.Link variant="source" verticalPadding={8} />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
