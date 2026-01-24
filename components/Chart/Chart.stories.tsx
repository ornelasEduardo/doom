import type { Meta, StoryObj } from "@storybook/react";
import * as d3Hierarchy from "d3-hierarchy";
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import { Info } from "lucide-react";
import { useState } from "react";

import { palette } from "../../styles/palettes";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Chip } from "../Chip/Chip";
import { Flex, Stack } from "../Layout/Layout";
import { Select } from "../Select/Select";
import { Slat } from "../Slat/Slat";
import { Text } from "../Text/Text";
import { Highlight, ElementHover } from "./behaviors";
import { Chart } from "./Chart";
import { ChartBehavior, RenderFrame } from "./types";

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

const ClickBehavior = (callback: (data: any) => void): ChartBehavior => {
  return ({ on, off, getChartContext }) => {
    const handleClick = (event: any) => {
      const ctx = getChartContext();
      if (!ctx || !ctx.resolveInteraction) {
        return;
      }

      const result = ctx.resolveInteraction(event.nativeEvent);

      if (result && result.data) {
        callback(result.data);
      }
    };

    on("CHART_POINTER_DOWN", handleClick);
    return () => off("CHART_POINTER_DOWN", handleClick);
  };
};

export const CustomRender1: Story = {
  args: {
    behaviors: [
      ElementHover({
        targetResolver: (el) =>
          el.tagName === "path" && el.classList.contains("arc"),
      }),
      Highlight({
        selector: ".arc",
        identify: (d) => d.data.name,
        onUpdate: (selection, { isHighlighted, isDimmed }) => {
          selection
            .transition()
            .duration(200)
            .style("opacity", isHighlighted ? 1 : isDimmed ? 0.3 : 0.8);
        },
      }),
      ClickBehavior((data) => {
        alert(`You clicked on ${data.data.name}: ${data.value}`);
      }),
    ],
    data: [
      {
        name: "Total",
        children: [
          {
            name: "Product",
            children: [
              { name: "R&D", value: 40 },
              { name: "Design", value: 25 },
              { name: "Engineering", value: 35 },
              { name: "QA", value: 20 },
            ],
          },
          {
            name: "Marketing",
            children: [
              { name: "Social", value: 20 },
              { name: "SEO", value: 15 },
              { name: "Content", value: 15 },
              { name: "Events", value: 25 },
            ],
          },
          {
            name: "Sales",
            children: [
              { name: "Direct", value: 30 },
              { name: "Channel", value: 20 },
            ],
          },
          {
            name: "Operations",
            children: [
              { name: "IT", value: 25 },
              { name: "Logistics", value: 20 },
              { name: "Facilities", value: 15 },
            ],
          },
          {
            name: "HR",
            children: [
              { name: "Recruiting", value: 15 },
              { name: "Training", value: 15 },
              { name: "Benefits", value: 10 },
            ],
          },
        ],
      },
    ] as any,
    title: "Organization Staffing (Sunburst)",
    style: {
      width: "100%",
      maxWidth: 600,
      height: 600,
    },
    d3Config: {
      grid: false,
      showAxes: false,
    },
    renderTooltip: (data: any) => (
      <Card
        style={{ padding: "8px 12px", minWidth: 150, pointerEvents: "none" }}
      >
        <Text style={{ marginBottom: 4 }} variant="h6">
          {data && data.data.name}
        </Text>
        <Text style={{ color: "var(--text-secondary)" }} variant="body">
          Personnel:{" "}
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
            {data && data.value}
          </span>
        </Text>
      </Card>
    ),
    render: (frame: RenderFrame<any>) => {
      const { container, size } = frame;
      const radius = size.radius;

      container.selectAll("*").remove();

      const g = container
        .append("g")
        .attr("transform", `translate(${size.width / 2},${size.height / 2})`);

      // Manual vivid palette for sunburst
      // Use Theme colors (Doom Palette)
      const colorScale = d3Scale.scaleOrdinal([
        palette.purple[400],
        palette.yellow[300],
        palette.green[400],
        palette.blue[400],
        palette.red[400],
        palette.slate[600],
      ]);

      // Extract root from array wrapper if needed
      const hierarchyData = Array.isArray(frame.container.datum())
        ? (frame.container.datum() as any)[0]
        : frame.container.datum();

      // Create hierarchy
      const root = d3Hierarchy
        .hierarchy(hierarchyData)
        .sum((d: any) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      // Create partition layout
      const partition = d3Hierarchy.partition().size([2 * Math.PI, radius]);

      partition(root);

      const arc = d3Shape
        .arc<any>()
        .startAngle((d: any) => d.x0)
        .endAngle((d: any) => d.x1)
        .innerRadius((d: any) => d.y0)
        .outerRadius((d: any) => d.y1)
        .padAngle(0.005)
        .cornerRadius(4);

      // Draw arcs
      g.selectAll("path")
        .data(root.descendants())
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .style("fill", (d: any) => {
          // Color based on parent to show hierarchy
          if (d.depth === 0) {
            return "#fff";
          } // White center
          while (d.depth > 1) {
            d = d.parent;
          }
          return colorScale(d.data.name);
        })
        .style("stroke", "var(--card-bg)")
        .style("stroke-width", "1px")
        .style("opacity", 0.8)
        .style("cursor", "pointer")
        .style("transition", "opacity 0.2s ease");

      // Add Labels
      g.selectAll("text")
        .data(
          root
            .descendants()
            .filter(
              (d: any) => d.depth && ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 10,
            ),
        ) // Filter small segments
        .enter()
        .append("text")
        .attr("transform", function (d: any) {
          const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
          const y = (d.y0 + d.y1) / 2;
          return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.35em")
        .text((d: any) => d.data.name)
        .style("fill", "var(--foreground)")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .style("text-shadow", "0px 0px 4px var(--card-bg)");
    },
  },
};

export const CustomRender2: Story = {
  args: {
    behaviors: [
      ElementHover({
        targetResolver: (el) =>
          el.tagName === "rect" && el.classList.contains("treemap-node"),
      }),
      Highlight({
        selector: ".treemap-node",
        identify: (d) => d.data.name,
        onUpdate: (selection, { isHighlighted }) => {
          selection.attr("fill-opacity", isHighlighted ? 1 : 0.8);
        },
      }),
    ],
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
    renderTooltip: (data: any) => (
      <Card style={{ padding: "8px 12px", minWidth: 150 }}>
        <Text style={{ marginBottom: 4 }} variant="h6">
          {data && data.id}
        </Text>
        <Text style={{ color: "var(--text-secondary)" }} variant="body">
          Value:{" "}
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
            {data && data.value}
          </span>
        </Text>
      </Card>
    ),
    render: (frame: RenderFrame<any>) => {
      const { container, size } = frame;
      import("d3-hierarchy").then((d3Hierarchy) => {
        // Extraction of original data from hierarchy if needed
        const rawData = container.datum() as any[];

        const root = d3Hierarchy
          .stratify<any>()
          .id((d) => d.name)
          .parentId((d) => d.parent)(rawData)
          .sum((d) => d.value)
          .sort((a, b) => (b.value || 0) - (a.value || 0));

        d3Hierarchy.treemap<any>().size([size.width, size.height]).padding(4)(
          root,
        );

        const colors = [
          "var(--primary)",
          "var(--secondary)",
          "var(--accent)",
          "var(--success)",
          "var(--warning)",
        ];

        const nodes = container
          .selectAll("g")
          .data(root.leaves())
          .enter()
          .append("g")
          .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

        nodes
          .append("rect")
          .attr("class", "treemap-node")
          .attr("width", (d: any) => d.x1 - d.x0)
          .attr("height", (d: any) => d.y1 - d.y0)
          .attr("fill", (_: any, i: number) => colors[i % colors.length])
          .attr("stroke", "var(--card-bg)")
          .attr("fill-opacity", 0.8)
          .style("rx", "var(--radius)")
          .style("ry", "var(--radius)");

        nodes
          .append("text")
          .attr("x", 8)
          .attr("y", 20)
          .text((d: any) => d.data.name)
          .style("font-size", "12px")
          .style("font-weight", 600)
          .style("fill", "var(--primary-foreground)")
          .style("pointer-events", "none");

        nodes
          .append("text")
          .attr("x", 8)
          .attr("y", 36)
          .text((d: any) => String(d.value))
          .style("font-size", "10px")
          .style("fill", "var(--primary-foreground)")
          .style("opacity", "0.8")
          .style("pointer-events", "none");
      });
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
      margin: { top: 10, right: 0, bottom: 10, left: 0 },
    },
    style: {
      width: "100%",
      maxWidth: 800,
      height: 200,
    },
  },
  render: (args: any) => {
    const [hoveredData, setHoveredData] = useState<any>(null);
    const currentData = hoveredData || args.data[args.data.length - 1];

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
            onValueChange={setHoveredData}
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
          style={{ height: 400 }}
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
              <Chart.Plot>
                <Chart.Cursor />
                <Chart.Grid />
                <Chart.Series
                  color={chartColor}
                  type={chartType}
                  x="label"
                  y="value"
                />
                <Chart.Axis />
              </Chart.Plot>

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

// =============================================================================
// NEW API DEMONSTRATIONS
// =============================================================================

/**
 * String Accessors provide a cleaner DX - just pass the property name.
 * Instead of `x={(d) => d.month}`, simply use `x="month"`
 */
export const StringAccessors: Story = {
  args: {
    data: [
      { month: "Jan", revenue: 15000 },
      { month: "Feb", revenue: 28000 },
      { month: "Mar", revenue: 22000 },
      { month: "Apr", revenue: 35000 },
      { month: "May", revenue: 42000 },
      { month: "Jun", revenue: 38000 },
    ],
    // String accessors - simpler than function accessors!
    x: "month" as any,
    y: "revenue" as any,
    type: "area",
    title: "String Accessors Demo",
    style: { width: "100%", maxWidth: 800, height: 400 },
    d3Config: { grid: true, showDots: true },
  },
};

/**
 * Multi-series charts allow multiple data visualizations on a single chart.
 * Each series can have its own y-accessor, color, and label.
 */
export const MultiSeries: Story = {
  render: () => {
    // Generate some intricate data
    const data = [
      { month: "Jan", revenue: 15000, users: 1200, expenses: 8000 },
      { month: "Feb", revenue: 28000, users: 1800, expenses: 12000 },
      { month: "Mar", revenue: 22000, users: 1500, expenses: 10000 },
      { month: "Apr", revenue: 35000, users: 2200, expenses: 15000 },
      { month: "May", revenue: 42000, users: 2800, expenses: 18000 },
      { month: "Jun", revenue: 38000, users: 2500, expenses: 16000 },
    ];

    return (
      <Chart.Root
        d3Config={{ grid: true, showDots: true }}
        data={data}
        style={{ width: "100%", maxWidth: 800, height: 400 }}
        x="month"
        y="revenue"
      >
        <Chart.Header title="Multi-Series Line Chart">
          <Chart.Legend layout="horizontal" />
        </Chart.Header>

        {/* With layout="custom", we must explicitly define the plot and its layers */}
        <Chart.Plot>
          <Chart.Grid />
          <Chart.Cursor />
          <Chart.Series
            color="var(--primary)"
            label="Revenue"
            type="line"
            x="month"
            y="revenue"
          />
          <Chart.Series
            color="var(--secondary)"
            label="Expenses"
            type="line"
            x="month"
            y="expenses"
          />
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>
    );
  },
};

/**
 * Scatter plots support an optional `size` accessor for bubble charts.
 */
export const ScatterPlot: Story = {
  render: () => {
    // Simple Linear Congruential Generator (LCG) for deterministic results
    let seed = 123456789;
    const seededRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const data = Array.from({ length: 50 }, (_, i) => ({
      income: Math.floor(15000 + seededRandom() * 85000),
      happiness: Number((4 + seededRandom() * 5 + (i % 5) * 0.2).toFixed(1)),
      population: Math.floor(2 + seededRandom() * 25),
      group: i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C",
    })).sort((a, b) => a.income - b.income);

    return (
      <Chart.Root
        d3Config={{
          grid: true,
          xAxisLabel: "Annual Income ($)",
          yAxisLabel: "Happiness Index",
          showDots: true,
        }}
        data={data}
        renderTooltip={(data: any) => (
          <Card
            className="p-3"
            style={{
              minWidth: 220,
            }}
          >
            <Stack gap={4}>
              {/* Header */}
              <Flex align="center" justify="space-between">
                <Text variant="body">City Analytics</Text>
                <Chip size="xs" variant="primary">
                  <Text variant="small">Group {data.group}</Text>
                </Chip>
              </Flex>

              {/* Main Value */}
              <Text variant="h3">{data.happiness.toFixed(2)}</Text>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#1a1f26",
                  width: "100%",
                }}
              />

              {/* Metadata */}
              <Stack gap={2}>
                <Flex align="center" justify="space-between">
                  <Text color="muted" variant="small">
                    Annual Income
                  </Text>
                  <Text variant="body">${data.income.toLocaleString()}</Text>
                </Flex>
                <Flex align="center" justify="space-between">
                  <Text color="muted" variant="small">
                    Population Density
                  </Text>
                  <Text variant="body">{data.population}k</Text>
                </Flex>
              </Stack>
            </Stack>
          </Card>
        )}
        style={{ width: "100%", maxWidth: 800, height: 400 }}
        subtitle="Bubble size represents population density"
        title="Income vs Happiness (50 Cities)"
        x="income"
        y="happiness"
      >
        <Chart.Series
          color="var(--primary)"
          label="Cities"
          size="population"
          type="scatter"
          x="income"
          y="happiness"
        />
      </Chart.Root>
    );
  },
};
