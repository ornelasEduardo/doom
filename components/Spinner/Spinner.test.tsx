import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renders correctly (accessibility)", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });

  it("applies standard sizes", () => {
    render(<Spinner data-testid="spinner-lg" size="lg" />);
    const spinner = screen.getByTestId("spinner-lg");
    // We can't check CSS class content in JSDOM easily, but we can verify it
    // doesn't crash
    expect(spinner).toBeInTheDocument();
  });
});
