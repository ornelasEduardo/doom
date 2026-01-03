import React from "react";
import { render, screen } from "@testing-library/react";
import { Link } from "./Link";
import { describe, it, expect, vi } from "vitest";

describe("Link Security", () => {
  it("blocks javascript: URLs and logs error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // When href is undefined (which it is for unsafe links), the role "link" might not be present
    // because an <a> without an href is not considered a link role by default in some environments.
    // However, we can query by text.
    render(<Link href="javascript:alert(1)">Malicious Link</Link>);
    const link = screen.getByText("Malicious Link");

    // Should not have the malicious href
    expect(link).not.toHaveAttribute("href", "javascript:alert(1)");
    expect(link).not.toHaveAttribute("href"); // It should be removed entirely

    // Should verify that the console error was called
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sentinel 🛡️: Blocked insecure javascript: URL")
    );

    consoleSpy.mockRestore();
  });

  it("allows safe URLs", () => {
    render(<Link href="https://example.com">Safe Link</Link>);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
  });
});
