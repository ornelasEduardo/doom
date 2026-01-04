import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Link } from "./Link";

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
      </Link>,
    );
    expect(screen.getByText("Button Link")).toBeInTheDocument();
  });

  it("should handle external links", () => {
    render(
      <Link isExternal href="https://example.com">
        External
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should handle disabled state", () => {
    const handleClick = vi.fn();
    const handleMouseEnter = vi.fn();

    render(
      <Link
        disabled
        href="#"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        Disabled
      </Link>,
    );
    const link = screen.getByText("Disabled");

    expect(link).toHaveAttribute("aria-disabled", "true");

    link.click();
    expect(handleClick).not.toHaveBeenCalled();

    fireEvent.mouseEnter(link);
    expect(handleMouseEnter).not.toHaveBeenCalled();
  });

  it("should handle prefetch functionality", async () => {
    const { container } = render(
      <Link prefetch href="/prefetch">
        Prefetch Link
      </Link>,
    );
    const link = screen.getByRole("link");

    const prefetchTag = container.querySelector("link[rel='prefetch']");
    expect(prefetchTag).toBeNull();

    fireEvent.mouseEnter(link);

    await waitFor(() => {
      const prefetchTag = document.head.querySelector(
        `link[rel='prefetch'][href='/prefetch']`,
      );
      expect(prefetchTag).toBeInTheDocument();
    });
  });

  it("should call onMouseEnter when not disabled", () => {
    const handleMouseEnter = vi.fn();
    render(
      <Link href="#" onMouseEnter={handleMouseEnter}>
        Hover Link
      </Link>,
    );
    const link = screen.getByRole("link");
    fireEvent.mouseEnter(link);
    expect(handleMouseEnter).toHaveBeenCalled();
  });

  it("should render external icon when isExternal is true", () => {
    const { container } = render(
      <Link isExternal href="https://example.com">
        External
      </Link>,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  // Security Test: Tabnabbing prevention
  it("should include rel='noopener noreferrer' when target='_blank' is passed without isExternal", () => {
    render(
      <Link href="https://example.com" target="_blank">
        Unsafe External
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should merge user-provided rel with security rel when target='_blank'", () => {
    render(
      <Link href="https://example.com" rel="nofollow" target="_blank">
        Merged Rel
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    // clsx merges strings with spaces
    expect(link).toHaveAttribute("rel", "nofollow noopener noreferrer");
  });
});
