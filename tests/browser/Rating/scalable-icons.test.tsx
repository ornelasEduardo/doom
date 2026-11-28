import { cleanup, render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Rating } from "../../../components/Rating/Rating";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { neubrutalistTheme } from "../../../styles/themes/presets";

const originalRootSize = document.documentElement.style.fontSize;
afterEach(() => {
  cleanup();
  document.documentElement.style.fontSize = originalRootSize;
});

for (const [size, pixels] of [
  ["sm", 16],
  ["md", 20],
  ["lg", 32],
] as const) {
  for (const rootSize of [16, 32]) {
    it(`keeps custom and built-in ${size} rating icons equal at a ${rootSize}px root`, () => {
      document.documentElement.style.fontSize = `${rootSize}px`;
      render(
        <DesignSystemProvider theme={neubrutalistTheme}>
          <Rating aria-label="Stars" size={size} />
          <Rating aria-label="Hearts" icon={Heart} size={size} />
        </DesignSystemProvider>,
      );
      for (const name of ["Stars", "Hearts"]) {
        const group = screen.getByRole("radiogroup", { name });
        const icon = group.querySelector("svg")!;
        const bounds = icon.getBoundingClientRect();
        expect(bounds.width).toBeCloseTo((pixels * rootSize) / 16);
        expect(bounds.height).toBeCloseTo((pixels * rootSize) / 16);
        const radio = group
          .querySelector('[role="radio"]')!
          .getBoundingClientRect();
        expect(radio.width).toBeGreaterThanOrEqual(bounds.width);
        expect(radio.height).toBeGreaterThanOrEqual(bounds.height);
      }
    });
  }
}
