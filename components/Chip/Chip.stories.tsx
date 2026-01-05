import type { Meta, StoryObj } from "@storybook/react";

import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "success", "warning", "error"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: "Default Chip",
  },
};

export const Primary: Story = {
  args: {
    children: "Primary",
    variant: "primary",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
  },
};

export const Error: Story = {
  args: {
    children: "Error",
    variant: "error",
  },
};

export const WithDismiss: Story = {
  args: {
    children: "Dismissible",
    onDismiss: () => alert("Dismissed!"),
  },
};

export const Clickable: Story = {
  args: {
    children: "Click me",
    onClick: () => alert("Clicked!"),
  },
};

export const FilterExample: Story = {
  args: {
    children: "Status: Active",
    variant: "default",
    onDismiss: () => {},
  },
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      <Chip size="xs">Extra Small</Chip>
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
      <Chip size="xl">Extra Large</Chip>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      <Chip variant="default">Default</Chip>
      <Chip variant="primary">Primary</Chip>
      <Chip variant="success">Success</Chip>
      <Chip variant="warning">Warning</Chip>
      <Chip variant="error">Error</Chip>
    </div>
  ),
};

export const DismissibleFilters: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      <Chip onDismiss={() => {}}>Status: Active</Chip>
      <Chip onDismiss={() => {}}>Team: X-Men</Chip>
      <Chip onDismiss={() => {}}>Role: Hero</Chip>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: "Disabled Chip",
    disabled: true,
    onDismiss: () => {},
  },
};
