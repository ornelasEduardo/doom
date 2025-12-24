import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Link } from "./Link";
import { describe, it, expect, vi } from "vitest";
import React from "react";

describe("Link Component", () => {
  it("should render children", () => {
    render(<Link href="/test">Test Link</Link>);
    expect(screen.getByText("Test Link")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });

  it("should render with variants", () => {
    render(
      <Link href="/test" variant="button">
        Button Link
      </Link>
    );
    expect(screen.getByText("Button Link")).toBeInTheDocument();
  });

  it("should handle external links", () => {
    render(
      <Link href="https://example.com" isExternal>
        External
      </Link>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should handle disabled state", () => {
    const handleClick = vi.fn();
    render(
      <Link href="#" disabled onClick={handleClick}>
        Disabled
      </Link>
    );
    const link = screen.getByText("Disabled");

    expect(link).toHaveAttribute("aria-disabled", "true");
    link.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
