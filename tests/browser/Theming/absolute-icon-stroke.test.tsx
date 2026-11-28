import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Spinner } from "../../../components/Spinner/Spinner";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

const originalRootSize = document.documentElement.style.fontSize;
afterEach(() => {
  cleanup();
  document.documentElement.style.fontSize = originalRootSize;
});

it("resolves themed absolute strokes without numeric coercion as icons scale", () => {
  const theme = defineTheme({
    name: "Absolute strokes",
    foundations: { icons: { stroke: "3" } },
  });
  render(
    <ThemeScope theme={theme}>
      <Spinner absoluteStrokeWidth />
    </ThemeScope>,
  );
  const icon = screen.getByRole("status");
  const path = icon.querySelector("path")!;
  document.documentElement.style.fontSize = "16px";
  const width = icon.getBoundingClientRect().width;
  expect(width).toBeGreaterThan(0);
  expect(getComputedStyle(icon).strokeWidth).toBe("3px");
  expect(getComputedStyle(path).vectorEffect).toBe("non-scaling-stroke");
  expect(icon.getAttribute("stroke-width")).not.toContain("NaN");
  document.documentElement.style.fontSize = "32px";
  expect(icon.getBoundingClientRect().width).toBe(width * 2);
  expect(getComputedStyle(icon).strokeWidth).toBe("3px");
  expect(getComputedStyle(path).vectorEffect).toBe("non-scaling-stroke");
});
