import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { type ThemeKey, themes } from "./definitions";
import { ThemeProvider } from "./ThemeProvider";

afterEach(cleanup);
describe("Orbital theme", () => {
  it("registers a complete built-in financial workspace palette", () => {
    const theme = themes["orbital" as ThemeKey];
    expect(theme).toBeDefined();
    for (const key of Object.keys(themes.default.variables)) {
      expect(theme.variables).toHaveProperty(key);
    }
    expect(theme.variables).toMatchObject({
      "--background": "#eee5d5",
      "--foreground": "#382d24",
      "--primary": "#87391e",
      "--control-text-transform": "none",
      "--control-hover-transform": "none",
      "--control-disabled-background": "none",
      "--control-focus-outline": "2px solid var(--primary)",
    });
  });
  it("removes Orbital appearance overrides when switching back to default", () => {
    const { container, rerender } = render(
      <ThemeProvider initialTheme={"orbital" as ThemeKey}>
        <div>Content</div>
      </ThemeProvider>,
    );
    expect(container.querySelector("style")?.textContent).toContain(
      "--control-text-transform: none",
    );
    rerender(
      <ThemeProvider initialTheme="default">
        <div>Content</div>
      </ThemeProvider>,
    );
    expect(container.querySelector("style")?.textContent).not.toContain(
      "--control-text-transform: none",
    );
    expect(container.querySelector("style")?.textContent).toContain(
      themes.default.variables["--primary"],
    );
  });
});

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
it("preserves AAA contrast for Orbital text surface pairs", () => {
  const v = themes.orbital.variables;
  const pairs = [
    [v["--foreground"], v["--background"]],
    [v["--muted-foreground"], v["--surface-accent"]],
    [v["--primary-foreground"], v["--primary"]],
    [v["--on-navigation-muted"], v["--surface-navigation"]],
    [v["--on-selection"], v["--surface-selection"]],
    [v["--on-readout-muted"], v["--surface-readout"]],
  ];
  for (const [fg, bg] of pairs) {
    const a = luminance(fg),
      b = luminance(bg);
    expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(7);
  }
});
