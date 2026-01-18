import type { Meta, StoryObj } from "@storybook/react";
import {
  BarChart3,
  CheckSquare,
  FileText,
  Home,
  Inbox,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  Shield,
  Skull,
  User,
  Users,
} from "lucide-react";
import type { ComponentProps } from "react";
import React, { useEffect, useState } from "react";

import { Chip } from "../Chip/Chip";
import { Text } from "../Text/Text";
import { Sidebar } from "./Sidebar";

const StatefulSidebar = (props: ComponentProps<typeof Sidebar>) => {
  const [activeItem, setActiveItem] = useState(props.activeItem);
  const [activeSection, setActiveSection] = useState(props.activeSection);

  useEffect(() => {
    setActiveItem(props.activeItem);
  }, [props.activeItem]);

  useEffect(() => {
    setActiveSection(props.activeSection);
  }, [props.activeSection]);

  return (
    <Sidebar
      {...props}
      activeItem={activeItem}
      activeSection={activeSection}
      onNavigate={(href, e) => {
        e?.preventDefault();
        setActiveItem(href);
      }}
      onSectionChange={setActiveSection}
    />
  );
};

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
        <div style={{ flex: 1, padding: "var(--spacing-6)" }}>
          <Text variant="h2">Main Content</Text>
          <Text color="muted">
            This is the main content area. The sidebar is on the left.
          </Text>
        </div>
      </div>
    ),
  ],
  render: (args) => <StatefulSidebar {...args} />,
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Simple: Story = {
  args: {
    activeItem: "/dashboard",
    children: (
      <>
        <Sidebar.Header>
          <Text variant="h3">DOOM</Text>
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Layers size={20} />} id="main" label="Main">
            <Sidebar.Item href="/" icon={<Home size={20} />}>
              Home
            </Sidebar.Item>
            <Sidebar.Item
              href="/dashboard"
              icon={<LayoutDashboard size={20} />}
            >
              Dashboard
            </Sidebar.Item>
            <Sidebar.Item href="/docs" icon={<FileText size={20} />}>
              Documents
            </Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section
            icon={<Users size={20} />}
            id="admin"
            label="Administration"
          >
            <Sidebar.Item href="/users" icon={<User size={20} />}>
              Users
            </Sidebar.Item>
            <Sidebar.Item href="/roles" icon={<Shield size={20} />}>
              Roles
            </Sidebar.Item>
            <Sidebar.Item href="/permissions" icon={<Lock size={20} />}>
              Permissions
            </Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section
            icon={<BarChart3 size={20} />}
            id="reports"
            label="Reports"
          >
            <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            <Sidebar.Item href="/reports/traffic">Traffic</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
        <Sidebar.Footer>
          <Sidebar.Item href="/logout" icon={<LogOut size={20} />}>
            Logout
          </Sidebar.Item>
        </Sidebar.Footer>
      </>
    ),
  },
};

export const NestedSections: Story = {
  args: {
    activeItem: "/users",
    children: (
      <>
        <Sidebar.Header>
          <Text variant="h3">DOOM</Text>
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section
            icon={<Users size={20} />}
            id="admin"
            label="Administration"
          >
            <Sidebar.Group
              icon={<User size={20} />}
              id="user-mgmt"
              label="User Management"
            >
              <Sidebar.Item href="/users">All Users</Sidebar.Item>
              <Sidebar.Item href="/users/new">Add User</Sidebar.Item>
            </Sidebar.Group>
            <Sidebar.Group
              icon={<Shield size={20} />}
              id="access"
              label="Access Control"
            >
              <Sidebar.Item href="/roles">Roles</Sidebar.Item>
              <Sidebar.Item href="/permissions">Permissions</Sidebar.Item>
            </Sidebar.Group>
          </Sidebar.Section>
        </Sidebar.Nav>
      </>
    ),
  },
};

export const WithRail: Story = {
  args: {
    withRail: true,
    activeSection: "main",
    activeItem: "/dashboard",
    brandIcon: <Skull size={24} />,
    children: (
      <>
        <Sidebar.Header>
          <Text variant="h3">DOOM</Text>
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Layers size={20} />} id="main" label="Main">
            <Sidebar.Item href="/" icon={<Home size={20} />}>
              Home
            </Sidebar.Item>
            <Sidebar.Item
              href="/dashboard"
              icon={<LayoutDashboard size={20} />}
            >
              Dashboard
            </Sidebar.Item>
            <Sidebar.Group
              icon={<Settings size={20} />}
              id="settings"
              label="Settings"
            >
              <Sidebar.Item href="/settings/profile">Profile</Sidebar.Item>
              <Sidebar.Item href="/settings/billing">Billing</Sidebar.Item>
            </Sidebar.Group>
            <Sidebar.Item href="/docs" icon={<FileText size={20} />}>
              Documents
            </Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section
            icon={<Users size={20} />}
            id="admin"
            label="Administration"
          >
            <Sidebar.Item href="/users" icon={<User size={20} />}>
              Users
            </Sidebar.Item>
            <Sidebar.Item href="/roles" icon={<Shield size={20} />}>
              Roles
            </Sidebar.Item>
            <Sidebar.Item href="/permissions" icon={<Lock size={20} />}>
              Permissions
            </Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section
            icon={<BarChart3 size={20} />}
            id="reports"
            label="Reports"
          >
            <Sidebar.Item href="/reports/sales">Sales</Sidebar.Item>
            <Sidebar.Item href="/reports/traffic">Traffic</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
        <Sidebar.Footer>
          <Sidebar.Item href="/logout" icon={<LogOut size={20} />}>
            Logout
          </Sidebar.Item>
        </Sidebar.Footer>
      </>
    ),
  },
};

export const WithRailCollapsed: Story = {
  args: {
    withRail: true,
    collapsed: true,
    activeSection: "admin",
    brandIcon: <Skull size={24} />,
    children: (
      <>
        <Sidebar.Header>
          <Text variant="h3">DOOM</Text>
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Layers size={20} />} id="main" label="Main">
            <Sidebar.Item href="/">Home</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section
            icon={<Users size={20} />}
            id="admin"
            label="Administration"
          >
            <Sidebar.Item href="/users">Users</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </>
    ),
  },
};

export const WithAppendedContent: Story = {
  args: {
    activeItem: "/inbox",
    children: (
      <>
        <Sidebar.Header>
          <Text variant="h3">DOOM</Text>
        </Sidebar.Header>
        <Sidebar.Nav>
          <Sidebar.Section icon={<Layers size={20} />} id="main" label="Main">
            <Sidebar.Item
              appendContent={
                <Chip size="xs" variant="primary">
                  12
                </Chip>
              }
              href="/inbox"
              icon={<Inbox size={20} />}
            >
              Inbox
            </Sidebar.Item>
            <Sidebar.Item
              appendContent={<Chip size="xs">New</Chip>}
              href="/tasks"
              icon={<CheckSquare size={20} />}
            >
              Tasks
            </Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Nav>
      </>
    ),
  },
};
