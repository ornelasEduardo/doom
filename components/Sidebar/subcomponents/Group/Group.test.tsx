import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SidebarContext } from "../../context";
import { SidebarContextValue } from "../../types";
import { Group } from "./Group";

// Helper to render Group with context
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

describe("Sidebar Group Component", () => {
  it("renders group with label", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
    );

    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders group icon when provided", () => {
    renderWithContext(
      <Group
        icon={<span data-testid="group-icon">👥</span>}
        id="users"
        label="Users"
      >
        <div>Content</div>
      </Group>,
    );

    expect(screen.getByTestId("group-icon")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
    );

    expect(screen.queryByTestId("group-icon")).not.toBeInTheDocument();
  });

  it("has aria-expanded false when collapsed", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
      { expandedSections: [] },
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("has aria-expanded true when expanded", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
      { expandedSections: ["users"] },
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("uses expanded prop when provided", () => {
    renderWithContext(
      <Group expanded id="users" label="Users">
        <div>Content</div>
      </Group>,
      { expandedSections: [] },
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("calls toggleSection when trigger is clicked", () => {
    const toggleSection = vi.fn();
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
      { toggleSection },
    );

    fireEvent.click(screen.getByRole("button", { name: /users/i }));
    expect(toggleSection).toHaveBeenCalledWith("users");
  });

  it("renders children content", () => {
    renderWithContext(
      <Group expanded id="users" label="Users">
        <div data-testid="child-content">Child Content</div>
      </Group>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    renderWithContext(
      <Group className="custom-group" id="users" label="Users">
        <div>Content</div>
      </Group>,
    );

    const group = screen.getByRole("button", { name: /users/i }).parentElement;
    expect(group?.className).toContain("custom-group");
  });

  it("has correct aria-controls attribute", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div>Content</div>
      </Group>,
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    const ariaControls = trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();
    expect(document.getElementById(ariaControls!)).toBeInTheDocument();
  });

  it("content has aria-hidden true when collapsed", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div data-testid="content">Content</div>
      </Group>,
      { expandedSections: [] },
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    const contentId = trigger.getAttribute("aria-controls");
    const content = document.getElementById(contentId!);
    expect(content).toHaveAttribute("aria-hidden", "true");
  });

  it("content has aria-hidden false when expanded", () => {
    renderWithContext(
      <Group id="users" label="Users">
        <div data-testid="content">Content</div>
      </Group>,
      { expandedSections: ["users"] },
    );

    const trigger = screen.getByRole("button", { name: /users/i });
    const contentId = trigger.getAttribute("aria-controls");
    const content = document.getElementById(contentId!);
    expect(content).toHaveAttribute("aria-hidden", "false");
  });
});
