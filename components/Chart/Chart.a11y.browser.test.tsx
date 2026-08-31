/**
 * Chart — automated accessibility audit.
 *
 * The a11y work in this component was verified by hand and by targeted
 * assertions. This runs axe over the real rendered output so the whole
 * ruleset is enforced rather than the handful of rules someone remembered.
 *
 * Enforced at AA, strictly and with no exceptions.
 *
 * AAA is a deliberate deferral, not an oversight. Running the AAA ruleset
 * across every theme surfaced two contrast gaps, both palette decisions rather
 * than component defects:
 *
 *   - doom and vigilante: the chart subtitle renders --muted-foreground at 12px
 *     and measures 6.96:1 and 6.5:1. AAA (1.4.6) wants 7:1.
 *   - solid variant on default and captain: the legend label is black on the
 *     solid background (#a855f7) at 5.3:1. White on that purple is roughly
 *     3.4:1, so no text colour clears 7:1 on it — the background itself would
 *     have to change.
 *
 * Both need a palette pass rather than a code change, so they are recorded here
 * for that work rather than papered over with an allowlist.
 */
import "../../styles/globals.scss";

import { render } from "@testing-library/react";
import axe from "axe-core";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";

const data = [
  { label: "A", value: 10 },
  { label: "B", value: 20 },
  { label: "C", value: 15 },
  { label: "D", value: 25 },
];

const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const settle = async () => {
  await frame();
  await new Promise((r) => setTimeout(r, 120));
  await frame();
};

let teardown: Array<() => void> = [];
afterEach(() => {
  teardown.forEach((fn) => fn());
  teardown = [];
});

const THEMES = ["default", "doom", "captain", "vigilante"] as const;

const mount = async (
  ui: React.ReactElement,
  theme: (typeof THEMES)[number] = "default",
) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const result = render(
    <DesignSystemProvider initialTheme={theme}>{ui}</DesignSystemProvider>,
    { container: host },
  );
  teardown.push(() => {
    result.unmount();
    host.remove();
  });
  await settle();
  return host;
};

const audit = async (host: HTMLElement) => {
  const results = await axe.run(host, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
  });
  return results.violations.map((v) => v.id).sort();
};

describe("Chart accessibility (axe)", () => {
  it("control: the audit harness still reports real violations", async () => {
    // A green audit is only meaningful if the harness can go red. Without this,
    // a misconfigured ruleset or an empty container would pass silently.
    const host = document.createElement("div");
    host.innerHTML = '<img src="x.png">';
    document.body.appendChild(host);
    teardown.push(() => host.remove());

    expect(await audit(host)).toContain("image-alt");
  });

  it("has no violations in its default form", async () => {
    const host = await mount(
      <Chart
        withLegend
        data={data}
        style={{ width: 600, height: 360 }}
        subtitle="Last four periods"
        title="Revenue"
        type="line"
        x="label"
        y="value"
      />,
    );

    expect(await audit(host)).toEqual([]);
  });

  it("has no violations with axes, grid and dots shown", async () => {
    const host = await mount(
      <Chart
        d3Config={{
          grid: true,
          showDots: true,
          xAxisLabel: "Period",
          yAxisLabel: "Revenue",
        }}
        data={data}
        style={{ width: 600, height: 360 }}
        title="Revenue"
        type="line"
        x="label"
        y="value"
      />,
    );

    expect(await audit(host)).toEqual([]);
  });

  it("has no violations for bar and scatter marks", async () => {
    const bar = await mount(
      <Chart
        data={data}
        style={{ width: 600, height: 360 }}
        title="Bars"
        type="bar"
        x="label"
        y="value"
      />,
    );
    expect(await audit(bar)).toEqual([]);

    const scatter = await mount(
      <Chart
        data={data}
        style={{ width: 600, height: 360 }}
        title="Scatter"
        type="scatter"
        x="label"
        y="value"
      />,
    );
    expect(await audit(scatter)).toEqual([]);
  });

  it("has no violations while a tooltip is showing", async () => {
    const host = await mount(
      <Chart
        d3Config={{ showDots: true }}
        data={data}
        style={{ width: 600, height: 360 }}
        title="Revenue"
        type="line"
        x="label"
        y="value"
      />,
    );

    const root = host.querySelector("[data-chart-container]") as HTMLElement;
    const circle = host.querySelectorAll("circle")[0];
    const r = circle.getBoundingClientRect();
    root.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
        bubbles: true,
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
    await frame();
    expect(
      document.querySelector("[data-chart-tooltip]")?.textContent ?? "",
    ).toContain("A");

    expect(await audit(host)).toEqual([]);
  });

  it.each(THEMES)(
    "has only the known contrast gap in the %s theme",
    async (theme) => {
      const host = await mount(
        <Chart
          withLegend
          d3Config={{ grid: true, showDots: true }}
          data={data}
          style={{ width: 600, height: 360 }}
          subtitle="Last four periods"
          title="Revenue"
          type="line"
          x="label"
          y="value"
        />,
        theme,
      );

      expect(await audit(host)).toEqual([]);
    },
  );

  it.each(THEMES)(
    "has no violations in the %s theme, solid variant",
    async (theme) => {
      const host = await mount(
        <Chart
          withLegend
          data={data}
          style={{ width: 600, height: 360 }}
          title="Revenue"
          type="line"
          variant="solid"
          x="label"
          y="value"
        />,
        theme,
      );

      expect(await audit(host)).toEqual([]);
    },
  );
});
