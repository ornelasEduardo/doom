import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Accordion, AccordionItem } from "./Accordion";

describe("Accordion Component", () => {
  it("renders triggers visible", () => {
    render(
      <Accordion>
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">
          Content 2
        </AccordionItem>
      </Accordion>
    );
    expect(screen.getByText("Trigger 1")).toBeInTheDocument();
    expect(screen.getByText("Trigger 2")).toBeInTheDocument();
  });

  it("toggles content on click (single)", () => {
    render(
      <Accordion type="single">
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
      </Accordion>
    );
    // Initially closed (unless default)
    const trigger = screen.getByRole("button", { name: /Trigger 1/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Click trigger
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Click again to close
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("allows multiple items open in multiple mode", () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">
          Content 2
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByRole("button", { name: /Trigger 1/i });
    const trigger2 = screen.getByRole("button", { name: /Trigger 2/i });

    fireEvent.click(trigger1);
    fireEvent.click(trigger2);

    expect(trigger1).toHaveAttribute("aria-expanded", "true");
    expect(trigger2).toHaveAttribute("aria-expanded", "true");
  });
});
