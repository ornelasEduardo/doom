import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Rail } from "./Rail";

describe("Sidebar Rail Component", () => {
  const defaultSections = [
    {
      id: "main",
      icon: <span data-testid="main-icon">🏠</span>,
      label: "Main",
    },
    {
      id: "admin",
      icon: <span data-testid="admin-icon">👥</span>,
      label: "Admin",
    },
  ];

  it("renders section icons", () => {
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("main-icon")).toBeInTheDocument();
    expect(screen.getByTestId("admin-icon")).toBeInTheDocument();
  });

  it("renders buttons with aria-labels", () => {
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
  });

  it("calls onSectionClick when button is clicked", () => {
    const onSectionClick = vi.fn();
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={onSectionClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    expect(onSectionClick).toHaveBeenCalledWith("admin");
  });

  it("marks active section with active class", () => {
    render(
      <Rail
        activeSection="main"
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    const mainButton = screen.getByRole("button", { name: /main/i });
    const adminButton = screen.getByRole("button", { name: /admin/i });

    expect(mainButton.className).toMatch(/active/);
    expect(adminButton.className).not.toMatch(/active/);
  });

  it("calls onSectionMouseEnter when button is hovered", () => {
    const onSectionMouseEnter = vi.fn();
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
        onSectionMouseEnter={onSectionMouseEnter}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: /admin/i }));
    expect(onSectionMouseEnter).toHaveBeenCalledWith("admin");
  });

  it("calls onSectionMouseLeave when button loses hover", () => {
    const onSectionMouseLeave = vi.fn();
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
        onSectionMouseLeave={onSectionMouseLeave}
      />,
    );

    fireEvent.mouseLeave(screen.getByRole("button", { name: /admin/i }));
    expect(onSectionMouseLeave).toHaveBeenCalled();
  });

  it("renders brand icon when provided", () => {
    render(
      <Rail
        activeSection={null}
        brandIcon={<span data-testid="brand-icon">🎮</span>}
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("brand-icon")).toBeInTheDocument();
  });

  it("does not render brand icon when not provided", () => {
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("brand-icon")).not.toBeInTheDocument();
  });

  it("renders empty rail when no sections provided", () => {
    render(
      <Rail activeSection={null} sections={[]} onSectionClick={vi.fn()} />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("handles undefined mouse event handlers gracefully", () => {
    render(
      <Rail
        activeSection={null}
        sections={defaultSections}
        onSectionClick={vi.fn()}
      />,
    );

    // Should not throw when hovering without handlers
    expect(() => {
      fireEvent.mouseEnter(screen.getByRole("button", { name: /main/i }));
      fireEvent.mouseLeave(screen.getByRole("button", { name: /main/i }));
    }).not.toThrow();
  });
});
