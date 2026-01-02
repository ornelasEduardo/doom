"use client";

import { Flex, Stack } from "../Layout/Layout";
import { useChartContext } from "./ChartContext";
import { ChartFooter } from "./ChartFooter";
import { ChartHeader } from "./ChartHeader";
import { ChartLegend } from "./ChartLegend";
import { ChartPlot } from "./ChartPlot";
import { ChartRoot } from "./ChartRoot";
import { ChartProps } from "./types";

export type {
  ChartConfig,
  ChartProps,
  DrawContext,
  LegendConfig,
  LegendItem,
} from "./types";

function ChartInternal<T>(props: ChartProps<T>) {
  const { title, subtitle, withLegend, type, render, renderTooltip } = props;

  return (
    <ChartRoot {...props}>
      <StandardChartLayout
        render={render}
        renderTooltip={renderTooltip}
        subtitle={subtitle}
        title={title}
        type={type}
        withLegend={withLegend}
      />
    </ChartRoot>
  );
}

function StandardChartLayout<T>({
  title,
  subtitle,
  withLegend,
  type,
  render,
  renderTooltip,
}: Pick<
  ChartProps<T>,
  "title" | "subtitle" | "withLegend" | "type" | "render" | "renderTooltip"
>) {
  // Standard Layout:
  // - Header (Title + Subtitle + Legend Top Right)
  // - Plot
  // - (No side/bottom legends in standard mode - usage Composition for that)
  const { legendItems } = useChartContext();

  const showLegend = withLegend && legendItems.length > 0;

  return (
    <Stack style={{ flex: 1, minHeight: 0 }}>
      {/* HEADER & LEGEND */}
      <Flex justify="space-between" style={{ width: "100%" }}>
        <ChartHeader subtitle={subtitle} title={title}>
          {showLegend && (
            <ChartLegend align="end" items={legendItems} layout="horizontal" />
          )}
        </ChartHeader>
      </Flex>

      <Flex gap={8} style={{ flex: 1, minHeight: 0 }}>
        {/* PLOT */}
        <ChartPlot render={render} renderTooltip={renderTooltip} type={type} />
      </Flex>
    </Stack>
  );
}

export const Chart = Object.assign(ChartInternal, {
  Root: ChartRoot,
  Header: ChartHeader,
  Footer: ChartFooter,
  Legend: ChartLegend,
  Plot: ChartPlot,
});
