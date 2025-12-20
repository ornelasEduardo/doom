import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Accordion, AccordionItem } from "./Accordion";
import styles from "./Accordion.module.scss";

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

    // Verify styling class for animation
    // The closest div with class 'item' should have 'isOpen'
    const item = trigger.closest(`.${styles.item}`);
    // Since styles.item is a hashed class name, we can't search for it directly w/o import
    // But we can check if it has the class that corresponds to isOpen in the DOM
    expect(trigger.parentElement?.parentElement).toHaveClass(/isOpen/);

    // Click again to close
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger.parentElement?.parentElement).not.toHaveClass(/isOpen/);
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

  it("calls onValueChange when toggled", () => {
    const onValueChange = vi.fn();
    render(
      <Accordion type="single" onValueChange={onValueChange}>
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
      </Accordion>
    );

    fireEvent.click(screen.getByRole("button", { name: /Trigger 1/i }));
    expect(onValueChange).toHaveBeenCalledWith("1");
  });

  it("works in controlled mode", () => {
    const { rerender } = render(
      <Accordion type="single" value="1">
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">
          Content 2
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByRole("button", { name: /Trigger 1/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    rerender(
      <Accordion type="single" value="2">
        <AccordionItem value="1" trigger="Trigger 1">
          Content 1
        </AccordionItem>
        <AccordionItem value="2" trigger="Trigger 2">
          Content 2
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByRole("button", { name: /Trigger 1/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.getByRole("button", { name: /Trigger 2/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
