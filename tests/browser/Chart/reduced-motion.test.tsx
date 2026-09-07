import "../../../styles/globals.scss";

import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";

declare module "vitest/browser" {
  interface BrowserCommands {
    setReducedMotion(preference: "reduce" | "no-preference"): Promise<void>;
  }
}

afterEach(async () => {
  cleanup();
  await commands.setReducedMotion("no-preference");
});

it.each(["line", "scatter", "bar"] as const)(
  "%s marks respect changes to reduced-motion preference",
  async (type) => {
    await commands.setReducedMotion("no-preference");
    const { container } = render(
      <Chart
        d3Config={{ showDots: true }}
        data={[
          { x: "Jan", y: 10 },
          { x: "Feb", y: 20 },
          { x: "Mar", y: 15 },
        ]}
        style={{ width: 700, height: 360 }}
        type={type}
        x="x"
        y="y"
      />,
    );
    const selector = type === "bar" ? '[data-chart-type="bar"]' : "circle";
    await waitFor(() =>
      expect(
        container.querySelectorAll(selector).length,
      ).toBeGreaterThanOrEqual(3),
    );
    const marks = container.querySelectorAll(selector);
    expect(getComputedStyle(marks[1]).transitionDuration).not.toBe("0s");
    await commands.setReducedMotion("reduce");
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    await userEvent.hover(marks[1]);
    await waitFor(() =>
      expect(
        container.querySelector("[data-chart-tooltip]")?.textContent,
      ).toContain("Feb"),
    );
    for (const mark of marks) {
      expect(getComputedStyle(mark).transitionDuration).toBe("0s");
      expect(mark.getAnimations()).toHaveLength(0);
    }
    await commands.setReducedMotion("no-preference");
    expect(getComputedStyle(marks[1]).transitionDuration).not.toBe("0s");
  },
);
