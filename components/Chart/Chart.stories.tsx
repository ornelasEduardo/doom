import type { Meta, StoryObj } from "@storybook/react";
import { select } from "d3-selection";
import * as d3Shape from "d3-shape";

import { Card } from "../Card/Card";
import { Text } from "../Text/Text";
import { Chart, type DrawContext } from "./Chart";

const meta: Meta<typeof Chart> = {
  title: "Components/Chart",
  component: Chart,
  parameters: {
    layout: "centered",
    docs: {
      source: {
        type: "code",
        language: "tsx",
      },
    },
  },
  tags: ["autodocs"],
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
    style: { width: 800, height: 400 },

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

export const Flat: Story = {
  args: {
    ...LineChart.args,
    title: "Flat Mode (No Shadow)",
    flat: true,
  },
};

export const Solid: Story = {
  args: {
    ...LineChart.args,
    title: "Solid Variant",
    variant: "solid",
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
    style: { width: 800, height: 400 },
    d3Config: {
      grid: true,
      yAxisLabel: "Revenue",
    },
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

export const NoAxes: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 5) * 20 + 50 + Math.random() * 10,
    })),
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    type: "line",
    title: "Real-time Signal",
    style: { width: 800, height: 400 },
    d3Config: {
      showAxes: false,
      curve: d3Shape.curveMonotoneX,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  },
};

export const Showcase: Story = {
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
    style: { width: 800, height: 450 },
    d3Config: {
      xAxisLabel: "Fiscal Year 2024",
      yAxisLabel: "Monthly Revenue (USD)",
      grid: true,
      withGradient: true,
      showDots: true,
      curve: d3Shape.curveMonotoneX,
      margin: { top: 40, right: 40, bottom: 60, left: 80 },
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

export const CustomRender: Story = {
  args: {
    ...LineChart.args,
    title: "Custom Scatter Plot (Generic Render)",
    d3Config: {
      grid: true,
      showDots: false,
    },
    render: (ctx: DrawContext<any>) => {
      ctx.g
        .selectAll(".custom-dot")
        .data(ctx.data)
        .enter()
        .append("circle")
        .attr("class", "custom-dot")
        .attr("cx", (d) => ctx.xScale(ctx.x(d)) || 0)
        .attr("cy", (d) => ctx.yScale(ctx.y(d)))
        .attr("r", (d) => Math.max(6, ctx.y(d) / 2))
        .attr("fill", "var(--secondary)")
        .attr("stroke", "var(--card-border)")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", (event) => {
          select(event.currentTarget).attr("fill", "var(--primary)");
        })
        .on("mousemove", (event, d) => ctx.showTooltip(event, d))
        .on("mouseleave", (event) => {
          ctx.hideTooltip();
          select(event.currentTarget).attr("fill", "var(--secondary)");
        });
    },
  },
};

export const PieChart: Story = {
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
    style: { width: 800, height: 500 },
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
        .innerRadius(radius * 0.5) // Donut
        .outerRadius(radius * 0.8)
        .cornerRadius(4); // Rounded corners

      const arcs = g
        .selectAll(".arc")
        .data(pie(ctx.data))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (_, i) => colorScale[i % colorScale.length])
        .attr("stroke", "var(--card-bg)")
        .attr("stroke-width", "2px")
        .style("cursor", "pointer")
        .on("mouseenter", (event) => {
          select(event.currentTarget).style("opacity", 0.8);
        })
        .on("mousemove", (event, d) => ctx.showTooltip(event, d.data))
        .on("mouseleave", (event) => {
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

export const Treemap: Story = {
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
    title: "Skills Distribution (Treemap)",
    x: (d: any) => d.name,

    y: (d: any) => d.value,
    style: { width: 800, height: 500 },
    d3Config: {
      grid: false,
      showAxes: false,
    },
    render: async (ctx: DrawContext<any>) => {
      // Dynamic import to avoid SSR issues or assumption of bundle presence

      const d3Hierarchy = await import("d3-hierarchy");

      // Transform flat data to hierarchy
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
        .style("cursor", "pointer")
        .on("mouseenter", (event) => {
          select(event.currentTarget).attr("fill-opacity", 1);
        })
        .on("mousemove", (event, d: any) => ctx.showTooltip(event, d.data))
        .on("mouseleave", (event) => {
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
        .style("fill", "#fff")
        .style("pointer-events", "none");

      nodes
        .append("text")
        .attr("x", 8)
        .attr("y", 36)
        .text((d) => String(d.value))
        .style("font-size", "10px")
        .style("fill", "rgba(255,255,255,0.8)")
        .style("pointer-events", "none");
    },
  },
};
