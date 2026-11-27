"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";

export const chart1DDataSchema = z.array(
  z.object({
    category: z.string(),
    value: z.number(),
  }),
);

export const chart2DDataSchema = z.object({
  labels: z.array(z.string()),
  series: z
    .array(
      z.object({
        category: z.string(),
        values: z.array(z.number()),
      }),
    )
    .default([]),
});

export const scatterDataSchema = z.array(
  z.object({
    name: z.string(),
    series: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
      }),
    ),
  }),
);

export const miniChartDataSchema = z.array(z.number());

export type Chart1DData = z.infer<typeof chart1DDataSchema>;
export type Chart2DData = z.infer<typeof chart2DDataSchema>;
export type ScatterData = z.infer<typeof scatterDataSchema>;
export type MiniChartData = z.infer<typeof miniChartDataSchema>;
