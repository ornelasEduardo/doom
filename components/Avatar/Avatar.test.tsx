import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

describe("Avatar Component", () => {
  it("renders image when src is valid", () => {
    render(<Avatar alt="User Avatar" fallback="JD" src="valid.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "valid.jpg");
    expect(img).toHaveAttribute("alt", "User Avatar");
  });

  it("renders fallback when src is missing", () => {
    render(<Avatar fallback="XY" />);
    expect(screen.getByText("XY")).toBeInTheDocument();
  });

  it("renders fallback when image errors", () => {
    render(<Avatar fallback="ER" src="invalid.jpg" />);
    const img = screen.getByRole("img");

    // Simulate error
    fireEvent.error(img);

    expect(screen.getByText("ER")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("truncates fallback to 2 chars", () => {
    render(<Avatar fallback="LONGNAME" />);
    expect(screen.getByText("LO")).toBeInTheDocument();
  });

  it("defaults to square shape", () => {
    const { container } = render(<Avatar fallback="XY" />);
    // Import styles to use the class name
    const avatar = container.firstChild;
    expect(avatar).toHaveClass(/square/);
  });
});
