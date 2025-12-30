import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { BreadcrumbItem, Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs Component", () => {
  it("renders children correctly", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem href="/home">Home</BreadcrumbItem>
        <BreadcrumbItem isCurrent>Page</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
  });

  it("marks current page", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem isCurrent>Current</BreadcrumbItem>
      </Breadcrumbs>,
    );
    const item = screen.getByText("Current").closest("li");
    expect(item).toHaveAttribute("aria-current", "page");
  });

  it("renders links for non-current items", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem href="/link">Link</BreadcrumbItem>
      </Breadcrumbs>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toHaveAttribute("href", "/link");
  });
});
