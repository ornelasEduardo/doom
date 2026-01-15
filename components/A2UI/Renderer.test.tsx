import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Renderer } from "./Renderer";

describe("Renderer", () => {
  it("renders a simple button", () => {
    const data = {
      type: "button",
      props: { "data-testid": "test-button" },
      children: ["Click Me"],
    };

    render(<Renderer data={data} />);

    const button = screen.getByTestId("test-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Click Me");
  });

  it("renders nested components", () => {
    const data = {
      type: "card",
      props: { "data-testid": "test-card" },
      children: [
        {
          type: "text",
          props: { "data-testid": "test-text" },
          children: ["Hello World"],
        },
      ],
    };

    render(<Renderer data={data} />);

    expect(screen.getByTestId("test-card")).toBeInTheDocument();
    expect(screen.getByTestId("test-text")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("handles unknown components gracefully", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = {
      type: "unknown-component",
      children: ["Should not render"],
    };

    const { container } = render(<Renderer data={data} />);

    expect(container).toBeEmptyDOMElement();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Renderer: Unknown component type "unknown-component"',
    );

    consoleSpy.mockRestore();
  });
});
