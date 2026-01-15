import type { Meta, StoryObj } from "@storybook/react";

import { CopyButton } from "./CopyButton";

const meta: Meta<typeof CopyButton> = {
  title: "Components/CopyButton",
  component: CopyButton,
  parameters: {
    layout: "centered",
  },
  args: {
    value: "Hello, clipboard!",
    children: "Copy",
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Copy to Clipboard",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    variant: "ghost",
    children: "Copy",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Copy Reference",
  },
};

export const LongContent: Story = {
  args: {
    value: `# A2UI Component Reference

You are generating UI using A2UI JSON format for the Doom Design System.`,
    children: "Copy Reference Doc",
  },
};
