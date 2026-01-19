import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SidebarContext } from "../../context";
import { SidebarContextValue } from "../../types";
import { Item } from "./Item";

// Helper to render Item with context
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

describe("Sidebar Item Component", () => {
  it("renders as a link when href is provided", () => {
    renderWithContext(<Item href="/home">Home</Item>);

    const link = screen.getByRole("link", { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home");
  });

  it("renders as a button when no href is provided", () => {
    renderWithContext(<Item>Action</Item>);

    const button = screen.getByRole("button", { name: /action/i });
    expect(button).toBeInTheDocument();
  });

  it("displays the label text", () => {
    renderWithContext(<Item href="/test">Test Label</Item>);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    renderWithContext(
      <Item href="/home" icon={<span data-testid="icon">🏠</span>}>
        Home
      </Item>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders with appended content", () => {
    renderWithContext(
      <Item appendContent={<span data-testid="badge">5</span>} href="/inbox">
        Inbox
      </Item>,
    );

    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("marks active item with aria-current", () => {
    renderWithContext(<Item href="/home">Home</Item>, {
      activeItem: "/home",
    });

    const link = screen.getByRole("link", { name: /home/i });
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("does not mark inactive item with aria-current", () => {
    renderWithContext(<Item href="/home">Home</Item>, {
      activeItem: "/other",
    });

    const link = screen.getByRole("link", { name: /home/i });
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate when link is clicked", () => {
    const onNavigate = vi.fn();
    renderWithContext(<Item href="/home">Home</Item>, { onNavigate });

    fireEvent.click(screen.getByRole("link", { name: /home/i }));
    expect(onNavigate).toHaveBeenCalledWith("/home", expect.anything());
  });

  it("calls onSectionChange when item is clicked and section is registered", () => {
    const onSectionChange = vi.fn();
    const itemToSection = new Map([["/home", "main"]]);
    renderWithContext(<Item href="/home">Home</Item>, {
      onSectionChange,
      itemToSection,
    });

    fireEvent.click(screen.getByRole("link", { name: /home/i }));
    expect(onSectionChange).toHaveBeenCalledWith("main");
  });

  it("does not call onSectionChange for items not in registry", () => {
    const onSectionChange = vi.fn();
    const itemToSection = new Map<string, string>();
    renderWithContext(<Item href="/orphan">Orphan</Item>, {
      onSectionChange,
      itemToSection,
    });

    fireEvent.click(screen.getByRole("link", { name: /orphan/i }));
    expect(onSectionChange).not.toHaveBeenCalled();
  });

  it("calls onClick handler when provided", () => {
    const onClick = vi.fn();
    renderWithContext(<Item onClick={onClick}>Click me</Item>);

    fireEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    renderWithContext(
      <Item className="custom-class" href="/home">
        Home
      </Item>,
    );

    const link = screen.getByRole("link", { name: /home/i });
    expect(link.className).toContain("custom-class");
  });

  it("applies active class when item is active", () => {
    renderWithContext(<Item href="/home">Home</Item>, {
      activeItem: "/home",
    });

    const link = screen.getByRole("link", { name: /home/i });
    expect(link.className).toMatch(/active/);
  });
});
