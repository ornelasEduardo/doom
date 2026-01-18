import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SidebarContext } from "../../context";
import { SidebarContextValue } from "../../types";
import { MobileTrigger } from "./MobileTrigger";

// Helper to render MobileTrigger with context
const renderWithContext = (
  ui: React.ReactElement,
  contextValue: Partial<SidebarContextValue> = {},
) => {
  const defaultContext: SidebarContextValue = {
    withRail: false,
    activeSection: null,
    activeItem: null,
    itemToSection: new Map(),
    expandedSections: [],
    isMobileOpen: false,
    setMobileOpen: vi.fn(),
    onNavigate: vi.fn(),
    onSectionChange: vi.fn(),
    toggleSection: vi.fn(),
    expandSection: vi.fn(),
  };

  return render(
    <SidebarContext.Provider value={{ ...defaultContext, ...contextValue }}>
      {ui}
    </SidebarContext.Provider>,
  );
};

describe("Sidebar MobileTrigger Component", () => {
  it("renders a button", () => {
    renderWithContext(<MobileTrigger />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has accessible aria-label", () => {
    renderWithContext(<MobileTrigger />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Open sidebar");
  });

  it("calls setMobileOpen(true) when clicked", () => {
    const setMobileOpen = vi.fn();
    renderWithContext(<MobileTrigger />, { setMobileOpen });

    fireEvent.click(screen.getByRole("button"));
    expect(setMobileOpen).toHaveBeenCalledWith(true);
  });

  it("renders default hamburger icon when no children", () => {
    renderWithContext(<MobileTrigger />);

    expect(screen.getByText("☰")).toBeInTheDocument();
  });

  it("renders custom children instead of hamburger", () => {
    renderWithContext(
      <MobileTrigger>
        <span data-testid="custom-icon">Menu</span>
      </MobileTrigger>,
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByText("☰")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    renderWithContext(<MobileTrigger className="custom-trigger" />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-trigger");
  });
});
