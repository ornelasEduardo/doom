import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Button } from "../../../components/Button/Button";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { defineTheme } from "../../../styles/theming/defineTheme";

const originalFontSize = document.documentElement.style.fontSize;
afterEach(() => {
  cleanup();
  document.documentElement.style.fontSize = originalFontSize;
});

it("lets a compact instance lower its minimum without clipping wrapped text", () => {
  document.documentElement.style.fontSize = "16px";
  render(
    <DesignSystemProvider>
      <Button style={{ minHeight: "1.5rem", paddingBlock: 0 }}>Save</Button>
      <Button style={{ minHeight: "1.5rem", paddingBlock: 0, width: "6rem" }}>
        Save all changes
      </Button>
    </DesignSystemProvider>,
  );
  const compact = screen.getByRole("button", { name: "Save" });
  expect(getComputedStyle(compact).minHeight).toBe("24px");
  expect(compact.getBoundingClientRect().height).toBeLessThan(40);
  expect(compact.scrollHeight).toBeLessThanOrEqual(compact.clientHeight + 1);
  const wrapped = screen.getByRole("button", { name: "Save all changes" });
  expect(wrapped.getBoundingClientRect().height).toBeGreaterThan(24);
  expect(wrapped.scrollHeight).toBeLessThanOrEqual(wrapped.clientHeight + 1);
});

it("supports scalable compact control minimums in custom theme defaults", () => {
  document.documentElement.style.fontSize = "32px";
  const theme = defineTheme({
    name: "Compact controls",
    defaults: { controls: { height: "1.5rem", paddingY: "0" } },
  });
  render(
    <DesignSystemProvider theme={theme}>
      <Button>Save</Button>
    </DesignSystemProvider>,
  );
  expect(screen.getByRole("button").getBoundingClientRect().height).toBe(48);
});
