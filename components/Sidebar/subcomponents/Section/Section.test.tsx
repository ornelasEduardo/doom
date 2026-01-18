import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SidebarContext } from "../../context";
import { SidebarContextValue } from "../../types";
import { Section } from "./Section";

// Helper to render Section with context
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

describe("Sidebar Section Component", () => {
  it("renders section with label", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
    );

    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  it("renders section icon", () => {
    renderWithContext(
      <Section
        icon={<span data-testid="section-icon">🏠</span>}
        id="main"
        label="Main"
      >
        <div>Content</div>
      </Section>,
    );

    expect(screen.getByTestId("section-icon")).toBeInTheDocument();
  });

  it("has aria-expanded false when collapsed", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { expandedSections: [] },
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("has aria-expanded true when expanded", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { expandedSections: ["main"] },
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("uses expanded prop when provided", () => {
    renderWithContext(
      <Section expanded icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { expandedSections: [] },
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("calls toggleSection when trigger is clicked", () => {
    const toggleSection = vi.fn();
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { toggleSection },
    );

    fireEvent.click(screen.getByRole("button", { name: /main/i }));
    expect(toggleSection).toHaveBeenCalledWith("main");
  });

  it("calls onSectionChange when withRail is true", () => {
    const onSectionChange = vi.fn();
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { withRail: true, onSectionChange },
    );

    fireEvent.click(screen.getByRole("button", { name: /main/i }));
    expect(onSectionChange).toHaveBeenCalledWith("main");
  });

  it("does not call onSectionChange when withRail is false", () => {
    const onSectionChange = vi.fn();
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { withRail: false, onSectionChange },
    );

    fireEvent.click(screen.getByRole("button", { name: /main/i }));
    expect(onSectionChange).not.toHaveBeenCalled();
  });

  it("renders children content", () => {
    renderWithContext(
      <Section expanded icon={<span>🏠</span>} id="main" label="Main">
        <div data-testid="child-content">Child Content</div>
      </Section>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("applies active class when section is active", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { activeSection: "main" },
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    expect(trigger.className).toMatch(/active/);
  });

  it("does not apply active class when section is not active", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
      { activeSection: "other" },
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    expect(trigger.className).not.toMatch(/active/);
  });

  it("applies custom className", () => {
    renderWithContext(
      <Section
        className="custom-section"
        icon={<span>🏠</span>}
        id="main"
        label="Main"
      >
        <div>Content</div>
      </Section>,
    );

    const section = screen.getByRole("button", { name: /main/i }).parentElement;
    expect(section?.className).toContain("custom-section");
  });

  it("has correct aria-controls attribute", () => {
    renderWithContext(
      <Section icon={<span>🏠</span>} id="main" label="Main">
        <div>Content</div>
      </Section>,
    );

    const trigger = screen.getByRole("button", { name: /main/i });
    const ariaControls = trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();
    expect(document.getElementById(ariaControls!)).toBeInTheDocument();
  });
});
