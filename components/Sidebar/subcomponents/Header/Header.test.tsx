import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Header } from "./Header";

describe("Sidebar Header Component", () => {
  it("renders children content", () => {
    render(<Header>Header Content</Header>);

    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Header className="custom-header">Content</Header>);

    const header = screen.getByText("Content");
    expect(header.className).toContain("custom-header");
  });

  it("renders multiple children", () => {
    render(
      <Header>
        <span data-testid="logo">Logo</span>
        <span data-testid="title">Title</span>
      </Header>,
    );

    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.getByTestId("title")).toBeInTheDocument();
  });

  it("applies header styles", () => {
    render(<Header>Content</Header>);

    const header = screen.getByText("Content");
    expect(header.className).toMatch(/header/);
  });
});
