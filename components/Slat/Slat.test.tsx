import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slat } from "./Slat";
import React from "react";

describe("Slat", () => {
  it("renders with label", () => {
    render(<Slat label="Test Slat" />);
    expect(screen.getByText("Test Slat")).toBeInTheDocument();
  });

  it("renders with secondary label", () => {
    render(<Slat label="Main Label" secondaryLabel="Sub Label" />);
    expect(screen.getByText("Sub Label")).toBeInTheDocument();
  });

  it("renders prepend and append content", () => {
    render(
      <Slat
        label="Slat Content"
        prependContent={<span data-testid="prepend">Pre</span>}
        appendContent={<span data-testid="append">App</span>}
      />
    );
    expect(screen.getByTestId("prepend")).toBeInTheDocument();
    expect(screen.getByTestId("append")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <Slat label="Clickable Slat" onClick={handleClick} data-testid="slat" />
    );

    const slat = screen.getByTestId("slat");
    fireEvent.click(slat);

    expect(handleClick).toHaveBeenCalled();
  });

  it("applies variant classes", () => {
    const { container } = render(<Slat label="Danger Slat" variant="danger" />);
    const slatElement = container.firstChild as HTMLElement;
    expect(slatElement.className).toContain("danger");
  });

  it("applies hoverable class when onClick is provided", () => {
    const { container } = render(
      <Slat label="Interactive" onClick={() => {}} />
    );
    const slatElement = container.firstChild as HTMLElement;
    expect(slatElement.className).toContain("hoverable");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Slat label="Custom" className="custom-class" />
    );
    const slatElement = container.firstChild as HTMLElement;
    expect(slatElement.className).toContain("custom-class");
  });

  it("renders with complex React nodes as labels", () => {
    render(
      <Slat
        label={<span data-testid="complex-label">Complex</span>}
        secondaryLabel={<span data-testid="complex-sub">Sub</span>}
      />
    );
    expect(screen.getByTestId("complex-label")).toBeInTheDocument();
    expect(screen.getByTestId("complex-sub")).toBeInTheDocument();
  });

  it("supports keyboard interactions", () => {
    const handleClick = vi.fn();
    render(
      <Slat label="Keyboard" onClick={handleClick} data-testid="slat-kb" />
    );
    const slat = screen.getByTestId("slat-kb");

    expect(slat).toHaveAttribute("role", "button");
    expect(slat).toHaveAttribute("tabIndex", "0");

    fireEvent.keyDown(slat, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(slat, { key: " " });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
