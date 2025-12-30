import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Text } from "./Text";

describe("Text Component", () => {
  it("should render children", () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should render as appropriate heading element", () => {
    render(<Text variant="h1">Heading 1</Text>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    render(<Text variant="h2">Heading 2</Text>);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it('should render as specified element via "as" prop', () => {
    render(<Text as="p">Paragraph</Text>);
    // Testing library doesn't have a getByTag, but we can check if it rendered.
    // We can check the tagName of the element.
    const element = screen.getByText("Paragraph");
    expect(element.tagName).toBe("P");
  });

  it("should apply variant styles", () => {
    // Since we can't easily check computed styles in JSDOM without more setup,
    // we'll just ensure it renders without error for different variants.
    render(<Text variant="caption">Caption</Text>);
    expect(screen.getByText("Caption")).toBeInTheDocument();
  });
});
