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

  it("leaves default target and rel unset", () => {
    render(<Link href="/test">Default</Link>);
    expect(screen.getByRole("link")).not.toHaveAttribute("target");
    expect(screen.getByRole("link")).not.toHaveAttribute("rel");
  });

  it.each([false, true])(
    "hardens an explicit blank target (isExternal=%s)",
    (isExternal) => {
      render(
        <Link href="/test" isExternal={isExternal} target="_blank">
          Blank
        </Link>,
      );
      expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
      expect(screen.getByRole("link")).toHaveAttribute(
        "rel",
        "noopener noreferrer",
      );
    },
  );

  it.each(["_self", "_parent", "preview", ""])(
    "preserves explicit target %j over the external default",
    (target) => {
      render(
        <Link isExternal href="/test" target={target}>
          Override
        </Link>,
      );
      expect(screen.getByRole("link")).toHaveAttribute("target", target);
      expect(screen.getByRole("link")).not.toHaveAttribute("rel");
    },
  );

  it.each([false, true])(
    "preserves rel for a non-blank target (isExternal=%s)",
    (isExternal) => {
      render(
        <Link
          href="/test"
          isExternal={isExternal}
          rel="nofollow author"
          target="_self"
        >
          Same tab
        </Link>,
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "rel",
        "nofollow author",
      );
    },
  );

  it.each([
    [undefined, ["noopener", "noreferrer"]],
    ["", ["noopener", "noreferrer"]],
    ["nofollow author", ["nofollow", "author", "noopener", "noreferrer"]],
    ["noopener", ["noopener", "noreferrer"]],
    ["noreferrer", ["noreferrer", "noopener"]],
    [
      "  nofollow\tnoopener\nnoopener noreferrer nofollow  ",
      ["nofollow", "noopener", "noreferrer"],
    ],
  ])("merges and deduplicates blank-target rel %j", (rel, expected) => {
    render(
      <Link isExternal href="/test" rel={rel}>
        Merged
      </Link>,
    );
    const tokens = screen.getByRole("link").getAttribute("rel")?.split(/\s+/);
    expect(tokens).toHaveLength(expected.length);
    expect(tokens).toEqual(expect.arrayContaining(expected));
  });

  it("hardens case-insensitive blank targets without duplicating security tokens", () => {
    render(
      <Link
        href="/test"
        rel="Author NOOPENER NoReFeRrEr noopener noreferrer"
        target="_BLANK"
      >
        Mixed case
      </Link>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("target", "_BLANK");
    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "Author NOOPENER NoReFeRrEr",
    );
  });

  it("adds missing security tokens to an uppercase blank target", () => {
    render(
      <Link href="/test" rel="Author" target="_BLANK">
        Uppercase
      </Link>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "Author noopener noreferrer",
    );
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
});
