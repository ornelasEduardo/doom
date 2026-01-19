import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Nav } from "./Nav";

describe("Sidebar Nav Component", () => {
  it("renders as a nav element", () => {
    render(
      <Nav>
        <div>Content</div>
      </Nav>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has accessible aria-label", () => {
    render(
      <Nav>
        <div>Content</div>
      </Nav>,
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Sidebar navigation");
  });

  it("renders children content", () => {
    render(
      <Nav>
        <div data-testid="child-content">Child Content</div>
      </Nav>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Nav className="custom-nav">
        <div>Content</div>
      </Nav>,
    );

    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("custom-nav");
  });

  it("renders multiple children", () => {
    render(
      <Nav>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </Nav>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByTestId("child-3")).toBeInTheDocument();
  });

  it("has displayName set", () => {
    expect(Nav.displayName).toBe("Nav");
  });
});
