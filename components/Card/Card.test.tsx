import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card Component", () => {
  it("should render children", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("should pass through props", () => {
    render(
      <Card className="custom-class" data-testid="test-card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("test-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("custom-class");
  });
});
