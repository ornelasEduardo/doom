import { cleanup, render, screen } from "@testing-library/react";
import { Download } from "lucide-react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import {
  Accordion,
  AccordionItem,
} from "../../../components/Accordion/Accordion";
import { Button } from "../../../components/Button/Button";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { captainTheme } from "../../../styles/themes/presets";

afterEach(cleanup);

for (const legacy of [true, false]) {
  const props = legacy
    ? { initialTheme: "captain" as const }
    : { theme: captainTheme };

  it(`keeps button icons beside their label (${legacy ? "legacy" : "object"})`, () => {
    render(
      <DesignSystemProvider {...props}>
        <Button>
          <Download aria-hidden="true" size={16} />
          <span>Export</span>
        </Button>
      </DesignSystemProvider>,
    );
    const button = screen.getByRole("button", { name: "Export" });
    const icon = button.querySelector("svg")!.getBoundingClientRect();
    const label = screen.getByText("Export").getBoundingClientRect();
    expect(icon.right).toBeLessThanOrEqual(label.left);
    expect(
      Math.abs(icon.top + icon.height / 2 - label.top - label.height / 2),
    ).toBeLessThan(1);
  });

  it(`keeps accordion chevrons at the trailing edge (${legacy ? "legacy" : "object"})`, () => {
    render(
      <DesignSystemProvider {...props}>
        <Accordion defaultValue="details">
          <AccordionItem trigger="Details" value="details">
            Content
          </AccordionItem>
        </Accordion>
      </DesignSystemProvider>,
    );
    const button = screen.getByRole("button", { name: "Details" });
    const bounds = button.getBoundingClientRect();
    const icon = button.querySelector("svg")!.getBoundingClientRect();
    expect(icon.left).toBeGreaterThan(bounds.left + bounds.width * 0.8);
    expect(
      Math.abs(icon.top + icon.height / 2 - bounds.top - bounds.height / 2),
    ).toBeLessThan(1);
  });
}
