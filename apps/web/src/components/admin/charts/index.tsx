"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { ActivityChartProps } from "./ActivityChart";
import { ChartSkeleton } from "./ChartSkeleton";
import type { GrowthChartProps } from "./GrowthChart";
import type { ReportBreakdownChartProps } from "./ReportBreakdownChart";

export const GrowthChart: ComponentType<GrowthChartProps> = dynamic(
  () =>
    import("./GrowthChart").then((mod) => ({
      default: mod.GrowthChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

export const ActivityChart: ComponentType<ActivityChartProps> = dynamic(
  () =>
    import("./ActivityChart").then((mod) => ({
      default: mod.ActivityChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

export const ReportBreakdownChart: ComponentType<ReportBreakdownChartProps> =
  dynamic(
    () =>
      import("./ReportBreakdownChart").then((mod) => ({
        default: mod.ReportBreakdownChart,
      })),
    {
      ssr: false,
      loading: () => <ChartSkeleton />,
    },
  );

export { ChartSkeleton };
