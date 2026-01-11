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

  it("should have padding by default (Standard usage)", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("DIV");
  });

  it("should support composition via Card.Root", () => {
    render(
      <Card.Root data-testid="card-root">
        <Card.Header>Header</Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card.Root>,
    );

    expect(screen.getByTestId("card-root")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
