import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Sidebar Footer Component", () => {
  it("renders children content", () => {
    render(<Footer>Footer Content</Footer>);

    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Footer className="custom-footer">Content</Footer>);

    const footer = screen.getByText("Content");
    expect(footer.className).toContain("custom-footer");
  });

  it("renders multiple children", () => {
    render(
      <Footer>
        <span data-testid="user-info">User</span>
        <span data-testid="logout">Logout</span>
      </Footer>,
    );

    expect(screen.getByTestId("user-info")).toBeInTheDocument();
    expect(screen.getByTestId("logout")).toBeInTheDocument();
  });

  it("applies footer styles", () => {
    render(<Footer>Content</Footer>);

    const footer = screen.getByText("Content");
    expect(footer.className).toMatch(/footer/);
  });
});
