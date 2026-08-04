"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Material recovery stages
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
    { source: 0, target: 3, value: 1500 },
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
    label: "Collected",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  PPT_L: {
    label: "Sorted",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  DMG_L: {
    label: "Recovered",
    colors: {
      light: ["#06b6d4", "#8b5cf6"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
  PPT_M: {
    label: "Sorted",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  DMG_M: {
    label: "Recovered",
    colors: {
      light: ["#06b6d4", "#8b5cf6"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
  CRT_R: {
    label: "Collected",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  PPT_R: {
    label: "Sorted",
    colors: {
      light: ["#8b5cf6", "#10b981"],
      dark: ["#a78bfa", "#34d399"],
    },
  },
  DMG_R: {
    label: "Recovered",
    colors: {
      light: ["#06b6d4", "#10b981"],
      dark: ["#22d3ee", "#34d399"],
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
          showValues // [!code highlight]
          valueFormatter={(value) => value.toLocaleString()}
        />
      </SankeyChart.Node>
      <SankeyChart.Link variant="gradient" verticalPadding={8} />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
