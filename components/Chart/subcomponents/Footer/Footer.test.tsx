import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Footer } from "./Footer";

// Mock Flex to verify props passed
vi.mock("../../../Layout/Layout", async () => {
  return {
    Flex: ({ children, justify, className, style }: any) => (
      <div
        className={className}
        data-justify={justify}
        data-testid="flex-mock"
        style={style}
      >
        {children}
      </div>
    ),
  };
});

describe("Footer", () => {
  it("renders children", () => {
    render(<Footer>Footer content</Footer>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("returns null when no children", () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });

  it("applies custom className", () => {
    render(<Footer className="custom-class">Content</Footer>);
    const footer = screen.getByTestId("flex-mock");
    expect(footer).toHaveClass("custom-class");
  });

  it("applies align prop correctly", () => {
    const { rerender } = render(<Footer align="start">Content</Footer>);
    let footer = screen.getByTestId("flex-mock");
    expect(footer).toHaveAttribute("data-justify", "flex-start");

    rerender(<Footer align="end">Content</Footer>);
    footer = screen.getByTestId("flex-mock");
    expect(footer).toHaveAttribute("data-justify", "flex-end");

    rerender(<Footer align="between">Content</Footer>);
    footer = screen.getByTestId("flex-mock");
    expect(footer).toHaveAttribute("data-justify", "space-between");
  });

  it("applies custom styles", () => {
    render(<Footer style={{ backgroundColor: "red" }}>Content</Footer>);
    const footer = screen.getByTestId("flex-mock");
    expect(footer).toHaveStyle({ backgroundColor: "red" });
  });
});
