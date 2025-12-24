import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "ghost",
        "outline",
        "success",
        "danger",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    loading: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    loading: true,
    children: "Processing...",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled Button",
  },
};
