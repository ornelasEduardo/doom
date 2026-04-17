import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

describe("ToggleGroup", () => {
  // --- Rendering ---

  it("renders a group with role='group'", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("renders items as buttons with aria-pressed", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("passes aria-label to group", () => {
    render(
      <ToggleGroup aria-label="Text formatting" type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Text formatting",
    );
  });

  // --- Single select ---

  it("single: selects a value on click", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    await user.click(boldBtn);
    expect(boldBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("single: deselects current value on re-click", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="bold">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    expect(boldBtn).toHaveAttribute("aria-pressed", "true");
    await user.click(boldBtn);
    expect(boldBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("single: only one item selected at a time", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="bold">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    const italicBtn = screen.getByRole("button", { name: "Italic" });

    expect(boldBtn).toHaveAttribute("aria-pressed", "true");
    expect(italicBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(italicBtn);
    expect(boldBtn).toHaveAttribute("aria-pressed", "false");
    expect(italicBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("single: calls onValueChange with string value", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" onValueChange={handleChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(handleChange).toHaveBeenCalledWith("bold");
  });

  // --- Multiple select ---

  it("multiple: selects multiple values", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" defaultValue={[]}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    const italicBtn = screen.getByRole("button", { name: "Italic" });

    await user.click(boldBtn);
    await user.click(italicBtn);

    expect(boldBtn).toHaveAttribute("aria-pressed", "true");
    expect(italicBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("multiple: deselects on re-click", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    expect(boldBtn).toHaveAttribute("aria-pressed", "true");

    await user.click(boldBtn);
    expect(boldBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("multiple: calls onValueChange with string[] value", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" defaultValue={[]} onValueChange={handleChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(handleChange).toHaveBeenCalledWith(["bold"]);

    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(handleChange).toHaveBeenCalledWith(["bold", "italic"]);
  });

  // --- Controlled mode ---

  it("controlled single: value prop controls selection", () => {
    render(
      <ToggleGroup type="single" value="bold">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("controlled single: does not change state internally on click", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" value="bold">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("button", { name: "Italic" }));
    // Still bold because controlled and no onValueChange to update
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("controlled multiple: value prop controls selection", () => {
    render(
      <ToggleGroup type="multiple" value={["bold", "italic"]}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Underline" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  // --- Disabled ---

  it("disabled group disables all items", () => {
    render(
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("disabled item prevents click", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" onValueChange={handleChange}>
        <ToggleGroupItem value="bold" disabled>
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  // --- Roving tabindex ---

  it("only one item has tabIndex=0 (first non-disabled when nothing pressed)", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("tabindex", "0");
    expect(buttons[1]).toHaveAttribute("tabindex", "-1");
    expect(buttons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("pressed item gets tabIndex=0 in single mode", () => {
    render(
      <ToggleGroup type="single" defaultValue="b">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("tabindex", "-1");
    expect(buttons[1]).toHaveAttribute("tabindex", "0");
    expect(buttons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("first pressed item gets tabIndex=0 in multiple mode", () => {
    render(
      <ToggleGroup type="multiple" defaultValue={["b", "c"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("tabindex", "-1");
    expect(buttons[1]).toHaveAttribute("tabindex", "0");
    expect(buttons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("skips disabled items for tabbable fallback", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" disabled>A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("tabindex", "-1");
    expect(buttons[1]).toHaveAttribute("tabindex", "0");
    expect(buttons[2]).toHaveAttribute("tabindex", "-1");
  });

  // --- Keyboard navigation ---

  it("arrow keys move focus between items (roving tabindex)", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");

    // Tab into the group
    await user.tab();
    expect(buttons[0]).toHaveFocus();

    // Arrow right moves to next
    await user.keyboard("{ArrowRight}");
    expect(buttons[1]).toHaveFocus();

    // Arrow right again
    await user.keyboard("{ArrowRight}");
    expect(buttons[2]).toHaveFocus();

    // Arrow right wraps to first
    await user.keyboard("{ArrowRight}");
    expect(buttons[0]).toHaveFocus();
  });

  it("arrow left moves focus backwards and wraps", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");

    await user.tab();
    expect(buttons[0]).toHaveFocus();

    // Arrow left wraps to last
    await user.keyboard("{ArrowLeft}");
    expect(buttons[2]).toHaveFocus();
  });

  it("disabled items are skipped in keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          B
        </ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    );

    const buttons = screen.getAllByRole("button");

    await user.tab();
    expect(buttons[0]).toHaveFocus();

    // Arrow right skips disabled B, goes to C
    await user.keyboard("{ArrowRight}");
    expect(buttons[2]).toHaveFocus();
  });

  it("Space/Enter toggles the focused item", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" onValueChange={handleChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.tab();
    await user.keyboard(" ");
    expect(handleChange).toHaveBeenCalledWith("bold");

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith("italic");
  });

  // --- Context error ---

  it("ToggleGroupItem throws when used outside ToggleGroup", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<ToggleGroupItem value="a">A</ToggleGroupItem>);
    }).toThrow("ToggleGroupItem must be used within <ToggleGroup>");
    consoleSpy.mockRestore();
  });

  it("applies size class to items", () => {
    render(
      <ToggleGroup type="single" size="sm">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/sm/);
  });
});
