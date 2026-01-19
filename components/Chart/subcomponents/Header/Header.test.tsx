import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "./Header";

describe("Header", () => {
  it("renders title as string", () => {
    render(<Header title="Chart Title" />);
    expect(screen.getByText("Chart Title")).toBeInTheDocument();
  });

  it("renders title as custom element", () => {
    render(<Header title={<h1 data-testid="custom-title">Custom</h1>} />);
    expect(screen.getByTestId("custom-title")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<Header subtitle="Chart subtitle" title="Title" />);
    expect(screen.getByText("Chart subtitle")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <Header title="Title">
        <span data-testid="child">Child content</span>
      </Header>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("returns null when no title, subtitle, or children", () => {
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it("applies custom className", () => {
    render(<Header className="custom-class" title="Title" />);
    expect(screen.getByText("Title").closest("div")).toBeDefined();
  });

  it("renders both title and subtitle together", () => {
    render(<Header subtitle="Subtitle" title="Title" />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });
});
