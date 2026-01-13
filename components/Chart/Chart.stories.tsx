import type { Meta, StoryObj } from "@storybook/react";
import { select } from "d3-selection";
import * as d3Shape from "d3-shape";
import { Info } from "lucide-react";
import { useState } from "react";

import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Flex, Stack } from "../Layout/Layout";
import { Select } from "../Select/Select";
import { Slat } from "../Slat/Slat";
import { Text } from "../Text/Text";
import { Chart, type DrawContext } from "./Chart";

const meta: Meta<typeof Chart> = {
  title: "Components/Chart",
  component: Chart,
  parameters: {
    layout: "padded",
    docs: {
      source: {
        type: "code",
        language: "tsx",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onValueChange: { action: "onValueChange" },
  },
};

export default meta;

type Story = StoryObj<typeof Chart>;

const data = [
  { label: "Jan", value: 10 },
  { label: "Feb", value: 25 },
  { label: "Mar", value: 40 },
  { label: "Apr", value: 30 },
  { label: "May", value: 60 },
  { label: "Jun", value: 45 },
];

// --- TYPES ---

export const LineChart: Story = {
  args: {
    data,
    x: (d: any) => d.label,
    y: (d: any) => d.value,
    type: "line",
    title: "Monthly Trends",
    style: {
      width: "100%",
      maxWidth: 800,
      height: 400,
    },

    d3Config: {
      grid: true,
      withGradient: true,
      showDots: true,
      hideYAxisDomain: true,
      yAxisLabel: "Net Worth",
      curve: d3Shape.curveMonotoneX,
    },
  },
};

export const AreaChart: Story = {
  args: {
    ...LineChart.args,
    title: "Area Visualization",
    type: "area",
  },
};

export const BarChart: Story = {
  args: {
    data,
    x: (d: any) => d.label,
    y: (d: any) => d.value,
    type: "bar",
    title: "Revenue by Month",
    style: { width: "100%", maxWidth: 800, height: 400 },
    d3Config: {
      grid: true,
      yAxisLabel: "Revenue",
    },
  },
};

export const WithLegendAndSubtitle: Story = {
  args: {
    data,
    x: (d: any) => d.label,
    y: (d: any) => d.value,
    type: "line",
    title: "Monthly Performance",
    subtitle: "Tracking key metrics over time",
    withLegend: true,
    style: { width: "100%", maxWidth: 800, height: 400 },
    d3Config: {
      grid: true,
      showDots: true,
      hideYAxisDomain: true,
    },
  },
};

export const CustomRender1: Story = {
  args: {
    data: [
      { label: "Chrome", value: 400 },
      { label: "Safari", value: 300 },
      { label: "Firefox", value: 300 },
      { label: "Edge", value: 200 },
    ],
    title: "Browser Share (Custom Pie)",
    x: (d: any) => d.label,
    y: (d: any) => d.value,
    style: {
      width: "100%",
      maxWidth: 800,
      height: 500,
    },
    d3Config: {
      grid: false,
      showAxes: false,
    },
    render: (ctx: DrawContext<any>) => {
      const radius = Math.min(ctx.innerWidth, ctx.innerHeight) / 2;

      const g = ctx.g
        .append("g")
        .attr(
          "transform",
          `translate(${ctx.innerWidth / 2},${ctx.innerHeight / 2})`,
        );

      const colorScale = [
        "var(--primary)",
        "var(--secondary)",
        "var(--accent)",
        "var(--muted-foreground)",
      ];

      const pie = d3Shape
        .pie<any>()
        .value((d) => d.value)
        .sort(null);

      const arc = d3Shape
        .arc<any>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8)
        .cornerRadius(4);

      const arcs = g
        .selectAll(".arc")
        .data(pie(ctx.data))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs
        .append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", (_, i) => colorScale[i % colorScale.length])
        .attr("stroke", "var(--card-bg)")
        .attr("stroke-width", "2px")
        .style("cursor", "crosshair")
        .style("touch-action", "none")
        .on("mouseenter", (event) => {
          select(event.currentTarget).style("opacity", 0.8);
        })
        .on("mousemove touchmove touchstart", (event) => {
          const result = ctx.resolveInteraction(event);
          if (result && result.data && select(result.element).classed("arc")) {
            const d: any = result.data;
            const isTouch = event.type.startsWith("touch");
            const svgNode = ctx.g.node()?.ownerSVGElement;

            if (svgNode) {
              const svgRect = svgNode.getBoundingClientRect();
              let clientX: number;
              let clientY: number;
              if (event.touches && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
              } else {
                clientX = event.clientX;
                clientY = event.clientY;
              }

              const px = clientX - svgRect.left;
              const py = clientY - svgRect.top;

              ctx.setHoverState({ x: px, y: py, data: d.data, isTouch });
            }
          }
        })
        .on("mouseleave touchend", (event) => {
          select(event.currentTarget).style("opacity", 1);
          ctx.hideTooltip();
        });

      arcs

        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text((d) => d.data.label)
        .style("fill", "var(--card-bg)")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("pointer-events", "none");
    },
  },
};

export const CustomRender2: Story = {
  args: {
    data: [
      { name: "Root", value: 0, parent: null },
      { name: "Tech", value: 0, parent: "Root" },
      { name: "Design", value: 0, parent: "Root" },
      { name: "Sales", value: 0, parent: "Root" },
      { name: "React", value: 400, parent: "Tech" },
      { name: "Svelte", value: 300, parent: "Tech" },
      { name: "Vue", value: 200, parent: "Tech" },
      { name: "Figma", value: 450, parent: "Design" },
      { name: "Sketch", value: 100, parent: "Design" },
      { name: "Q4", value: 600, parent: "Sales" },
    ],
    title: "Skills Distribution (Custom Treemap)",
    x: (d: any) => d.name,

    y: (d: any) => d.value,
    style: {
      width: "100%",
      maxWidth: 800,
      height: 500,
    },
    d3Config: {
      grid: false,
      showAxes: false,
    },
    render: async (ctx: DrawContext<any>) => {
      const d3Hierarchy = await import("d3-hierarchy");

      const root = d3Hierarchy
        .stratify<any>()
        .id((d) => d.name)
        .parentId((d) => d.parent)(ctx.data)
        .sum((d) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      d3Hierarchy
        .treemap<any>()
        .size([ctx.innerWidth, ctx.innerHeight])
        .padding(4)(root);

      const colors = [
        "var(--primary)",
        "var(--secondary)",
        "var(--accent)",
        "var(--success)",
        "var(--warning)",
      ];

      const nodes = ctx.g
        .selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

      nodes
        .append("rect")
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("height", (d: any) => d.y1 - d.y0)
        .attr("fill", (_, i) => colors[i % colors.length])
        .attr("stroke", "var(--card-bg)")
        .attr("fill-opacity", 0.8)
        .style("rx", "var(--radius)")
        .style("ry", "var(--radius)")
        .style("cursor", "crosshair")
        .style("touch-action", "none")
        .on("mouseenter", (event) => {
          select(event.currentTarget).attr("fill-opacity", 1);
        })
        .on("mousemove touchmove touchstart", (event) => {
          const result = ctx.resolveInteraction(event);
          if (result && result.data) {
            const d: any = result.data;
            if (typeof d.x0 === "number") {
              const isTouch = event.type.startsWith("touch");
              const svgNode = ctx.g.node()?.ownerSVGElement;

              if (svgNode) {
                const svgRect = svgNode.getBoundingClientRect();
                let clientX: number;
                let clientY: number;
                if (event.touches && event.touches.length > 0) {
                  clientX = event.touches[0].clientX;
                  clientY = event.touches[0].clientY;
                } else {
                  clientX = event.clientX;
                  clientY = event.clientY;
                }

                const px = clientX - svgRect.left;
                const py = clientY - svgRect.top;

                ctx.setHoverState({ x: px, y: py, data: d.data, isTouch });
              }
            }
          }
        })
        .on("mouseleave touchend", (event) => {
          select(event.currentTarget).attr("fill-opacity", 0.8);
          ctx.hideTooltip();
        });

      nodes
        .append("text")
        .attr("x", 8)
        .attr("y", 20)
        .text((d) => d.data.name)
        .style("font-size", "12px")
        .style("font-weight", 600)
        .style("fill", "var(--primary-foreground)")
        .style("pointer-events", "none");

      nodes
        .append("text")
        .attr("x", 8)
        .attr("y", 36)
        .text((d) => String(d.value))
        .style("font-size", "10px")
        .style("fill", "var(--primary-foreground)")
        .style("opacity", "0.8")
        .style("pointer-events", "none");
    },
  },
};

// --- VARIANTS ---

export const Solid: Story = {
  args: {
    ...LineChart.args,
    title: "Solid Variant",
    variant: "solid",
  },
};

export const Flat: Story = {
  args: {
    ...LineChart.args,
    title: "Flat Mode (No Shadow)",
    flat: true,
  },
};

export const IntegratedChart: Story = {
  args: {
    ...LineChart.args,
    title: null,
    type: "area",
    withFrame: false,
    d3Config: {
      grid: false,
      withGradient: true,
      showDots: false,
      showAxes: false,
      curve: d3Shape.curveMonotoneX,
    },
    style: {
      width: "100%",
      maxWidth: 800,
      height: 200,
    },
  },
  render: (args: any) => {
    const [activeData, setActiveData] = useState<any>(null);
    const currentData = activeData || args.data[args.data.length - 1];

    const currentIndex = args.data.indexOf(currentData);
    const prevData = args.data[currentIndex - 1];
    let percentChange = 0;

    if (prevData && prevData.value !== 0) {
      percentChange =
        ((currentData.value - prevData.value) / prevData.value) * 100;
    }

    const isPositive = percentChange >= 0;

    return (
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          maxWidth: 400,
        }}
      >
        <Stack
          className="py-5 px-5"
          gap={0}
          style={{ marginBottom: "-1.5rem" }}
        >
          <Text style={{ color: "var(--text-secondary)" }} variant="h6">
            Total Balance
          </Text>
          <Flex align="center" gap={2}>
            <Text variant="h3">${currentData.value.toLocaleString()}</Text>
            <Badge variant={isPositive ? "success" : "error"}>
              {isPositive ? "+" : ""}
              {percentChange.toFixed(1)}%
            </Badge>
          </Flex>
          <Chart
            {...args}
            renderTooltip={() => null}
            onValueChange={setActiveData}
          />
        </Stack>
        <Stack gap={4} style={{ padding: "0 20px 20px" }}>
          <Stack gap={2}>
            {[
              { label: "Incoming", value: "+$4,200", color: "var(--success)" },
              {
                label: "Outgoing",
                value: "-$1,150",
                color: "var(--error)",
              },
              {
                label: "Investments",
                value: "+$850",
                color: "var(--success)",
              },
            ].map((item) => (
              <Slat
                key={item.label}
                appendContent={
                  <Text
                    style={{
                      fontWeight: 600,
                      color: item.color,
                    }}
                    variant="body"
                  >
                    {item.value}
                  </Text>
                }
                label={item.label}
              />
            ))}
          </Stack>
          <Button style={{ width: "100%" }} variant="primary">
            View Full Report
          </Button>
        </Stack>
      </Card>
    );
  },
};

export const WithD3Config: Story = {
  args: {
    ...LineChart.args,
    title: "Custom D3 Configuration",
    d3Config: {
      curve: d3Shape.curveStep,

      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      grid: true,
      withGradient: true,
      showDots: true,
      hideYAxisDomain: true,
    },
  },
};

export const DetailedTooltip: Story = {
  args: {
    data: [
      { month: "Jan", revenue: 4500, users: 120, churn: "2.1%" },
      { month: "Feb", revenue: 5200, users: 150, churn: "1.8%" },
      { month: "Mar", revenue: 4900, users: 180, churn: "2.5%" },
      { month: "Apr", revenue: 6300, users: 220, churn: "1.2%" },
      { month: "May", revenue: 7800, users: 300, churn: "0.8%" },
      { month: "Jun", revenue: 8500, users: 400, churn: "1.1%" },
      { month: "Jul", revenue: 9200, users: 550, churn: "0.9%" },
      { month: "Aug", revenue: 8800, users: 600, churn: "1.5%" },
      { month: "Sep", revenue: 10500, users: 700, churn: "1.0%" },
      { month: "Oct", revenue: 12000, users: 850, churn: "0.5%" },
      { month: "Nov", revenue: 11500, users: 900, churn: "0.7%" },
      { month: "Dec", revenue: 14000, users: 1000, churn: "0.4%" },
    ],
    x: (d: any) => d.month,
    y: (d: any) => d.revenue,
    type: "area",
    variant: "default",
    title: "Fiscal Year Report",
    style: {
      width: "100%",
      height: 450,
    },
    d3Config: {
      xAxisLabel: "Fiscal Year 2024",
      yAxisLabel: "Monthly Revenue (USD)",
      grid: true,
      withGradient: true,
      showDots: true,
      curve: d3Shape.curveMonotoneX,
    },
    renderTooltip: (data: any) => (
      <Card style={{ padding: "12px", minWidth: "200px" }}>
        <div
          style={{
            borderBottom: "1px solid var(--border-width)",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <Text
            style={{
              color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}
            variant="h6"
          >
            {data.month} 2024
          </Text>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "var(--text-secondary)" }} variant="body">
              Revenue
            </Text>
            <Text style={{ fontWeight: 800 }} variant="h6">
              ${data.revenue.toLocaleString()}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "var(--text-secondary)" }} variant="body">
              Active Users
            </Text>
            <Text variant="h6">{data.users}</Text>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "var(--text-secondary)" }} variant="body">
              Churn Rate
            </Text>
            <Text style={{ color: "var(--error)" }} variant="h6">
              {data.churn}
            </Text>
          </div>
        </div>
      </Card>
    ),
  },
};

export const CompositionExample: Story = {
  render: () => {
    const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");
    const [chartColor, setChartColor] = useState("var(--primary)");

    const chartTypes = [
      { value: "line", label: "Line" },
      { value: "area", label: "Area" },
      { value: "bar", label: "Bar" },
    ];

    const chartColors = [
      { value: "var(--primary)", label: "Primary" },
      { value: "var(--secondary)", label: "Secondary" },
      { value: "var(--accent)", label: "Accent" },
      { value: "var(--success)", label: "Success" },
      { value: "var(--warning)", label: "Warning" },
      { value: "var(--error)", label: "Error" },
    ];

    return (
      <div style={{ width: "100%", maxWidth: 800 }}>
        <Chart.Root
          d3Config={{
            grid: true,
            yAxisLabel: "Custom Y Axis Label",
            xAxisLabel: "Custom X Axis Label",
            curve: d3Shape.curveMonotoneX,
            showDots: true,
          }}
          data={data}
          x={(d: any) => d.label}
          y={(d: any) => d.value}
        >
          <Stack style={{ height: "100%" }}>
            <Chart.Header
              subtitle="Using Sub-components"
              title={
                <Text as="h1" variant="h4">
                  Composed Chart
                </Text>
              }
            >
              <Flex gap={2}>
                <Select
                  options={chartTypes}
                  style={{ width: `12ch` }}
                  value={chartType}
                  onChange={(e) =>
                    setChartType(e.target.value as "line" | "area" | "bar")
                  }
                />
                <Select
                  options={chartColors}
                  style={{ width: `16ch` }}
                  value={chartColor}
                  onChange={(e) => setChartColor(e.target.value as string)}
                />
              </Flex>
            </Chart.Header>

            <Flex gap={4} style={{ flex: 1 }}>
              <Chart.Plot color={chartColor} type={chartType} />

              <Chart.Legend
                items={(legendItems) =>
                  legendItems.map((_, index) => ({
                    label: `Series ${index + 1}`,
                    color: chartColor,
                  }))
                }
                layout="vertical"
                style={{ alignSelf: "center" }}
              />
            </Flex>

            <Chart.Footer>
              <Slat
                label={
                  <Text>
                    An example of how to use the composition approach for the
                    chart component
                  </Text>
                }
                prependContent={<Info />}
              ></Slat>
            </Chart.Footer>
          </Stack>
        </Chart.Root>
      </div>
    );
  },
};
