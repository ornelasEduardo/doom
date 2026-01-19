import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";

import { describe, expect, it } from "vitest";

import { Alert } from "./Alert";

describe("Alert Component", () => {
  it("renders title correctly", () => {
    render(<Alert title="Test Alert" />);
    expect(screen.getByText("Test Alert")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<Alert description="Description text" title="Title" />);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("applies correct role", () => {
    render(<Alert title="Alert" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
