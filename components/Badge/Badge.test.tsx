import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";
import { describe, it, expect } from "vitest";
import React from "react";

describe("Badge Component", () => {
  it("should render children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("should render with different variants", () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText("Primary")).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
  it("should render with different sizes", () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText("Small")).toBeInTheDocument();

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText("Large")).toBeInTheDocument();
  });
});
