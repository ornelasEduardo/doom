import "@testing-library/jest-dom";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { Home, Users } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "./Sidebar";

describe("Sidebar Component", () => {
  it("renders navigation items", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
            <Sidebar.Item href="/settings">Settings</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
  });

  it("renders with icons", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home" icon={<Home data-testid="home-icon" />}>
              Home
            </Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    expect(screen.getAllByTestId("home-icon").length).toBeGreaterThan(0);
  });

  it("marks active item with aria-current", () => {
    render(
      <Sidebar activeItem="/home">
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
            <Sidebar.Item href="/settings">Settings</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    expect(homeLinks[0]).toHaveAttribute("aria-current", "page");
  });

  it("calls onNavigate when item is clicked", () => {
    const onNavigate = vi.fn();
    render(
      <Sidebar onNavigate={onNavigate}>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const homeLinks = screen.getAllByRole("link", { name: /home/i });
    fireEvent.click(homeLinks[0]);
    expect(onNavigate).toHaveBeenCalledWith("/home", expect.anything());
  });

  it("expands and collapses sections", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Users</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const triggers = screen.getAllByRole("button", { name: /admin/i });
    const trigger = triggers[0];
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("supports expanded prop on sections", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Users</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const triggers = screen.getAllByRole("button", { name: /admin/i });
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("renders header and footer slots", () => {
    render(
      <Sidebar>
        <Sidebar.Header>Header Content</Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
        <Sidebar.Footer>Footer Content</Sidebar.Footer>
      </Sidebar>,
    );

    expect(screen.getAllByText("Header Content").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Footer Content").length).toBeGreaterThan(0);
  });

  it("renders rail in withRail mode", () => {
    render(
      <Sidebar withRail activeSection="main">
        <Sidebar.Nav>
          <Sidebar.Section icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Users</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const desktopSidebar = screen.getByTestId("sidebar-desktop");
    const railItems = within(desktopSidebar).getAllByRole("button", {
      name: /main|admin/i,
    });
    expect(railItems.length).toBe(2);
  });

  it("changes section on rail icon click", () => {
    const onSectionChange = vi.fn();
    render(
      <Sidebar withRail activeSection="main" onSectionChange={onSectionChange}>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Users</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const desktopSidebar = screen.getByTestId("sidebar-desktop");
    const adminButtons = within(desktopSidebar).getAllByRole("button", {
      name: /admin/i,
    });
    fireEvent.click(adminButtons[0]);
    expect(onSectionChange).toHaveBeenCalledWith("admin");
  });

  it("renders items with appended content", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item
              appendContent={<span data-testid="badge">5</span>}
              href="/inbox"
            >
              Inbox
            </Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const badges = screen.getAllByTestId("badge");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders items as links when href is provided", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/dashboard">Dashboard</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const links = screen.getAllByRole("link", { name: /dashboard/i });
    expect(links[0]).toHaveAttribute("href", "/dashboard");
  });

  it("toggles groups within sections", () => {
    render(
      <Sidebar>
        <Sidebar.Nav>
          <Sidebar.Section expanded icon={<Home />} id="main" label="Main">
            <Sidebar.Group icon={<Users />} id="users-group" label="Users">
              <Sidebar.Item href="/users/list">User List</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const groupTriggers = screen.getAllByRole("button", { name: /users/i });
    const groupTrigger = groupTriggers[0];
    expect(groupTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(groupTrigger);
    expect(groupTrigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(groupTrigger);
    expect(groupTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("implements hover peek logic in collapsed rail mode", () => {
    render(
      <Sidebar collapsed withRail activeSection="main">
        <Sidebar.Nav>
          <Sidebar.Section icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home Content</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Admin Content</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const desktopSidebar = screen.getByTestId("sidebar-desktop");

    const panel = screen.getByTestId("sidebar-panel");
    expect(panel.className).toMatch(/collapsed/);
    expect(panel.className).not.toMatch(/peeking/);

    const adminRailButton = within(desktopSidebar).getByRole("button", {
      name: /admin/i,
    });

    fireEvent.mouseEnter(adminRailButton);

    // Panel is still collapsed but now peeking
    expect(panel.className).toMatch(/collapsed/);
    expect(panel.className).toMatch(/peeking/);

    expect(
      within(desktopSidebar).getByText("Admin Content"),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(desktopSidebar);
    expect(panel.className).toMatch(/collapsed/);
    expect(panel.className).not.toMatch(/peeking/);
  });

  it("clears peek state after navigation", () => {
    const onNavigate = vi.fn();
    render(
      <Sidebar collapsed withRail activeSection="main" onNavigate={onNavigate}>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Home />} id="main" label="Main">
            <Sidebar.Item href="/home">Home</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section icon={<Users />} id="admin" label="Admin">
            <Sidebar.Item href="/users">Users List</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </Sidebar>,
    );

    const desktopSidebar = screen.getByTestId("sidebar-desktop");
    const adminRailButton = within(desktopSidebar).getByRole("button", {
      name: /admin/i,
    });

    fireEvent.mouseEnter(adminRailButton);

    const userLink = within(desktopSidebar).getByText("Users List");
    fireEvent.click(userLink);

    expect(onNavigate).toHaveBeenCalledWith("/users", expect.anything());

    const panel = screen.getByTestId("sidebar-panel");
    expect(panel.className).toMatch(/collapsed/);
  });
});
