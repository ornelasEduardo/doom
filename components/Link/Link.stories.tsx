import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Components/Link",
  component: Link,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "button", "subtle"],
    },
    isExternal: {
      description: 'Adds an external link icon and sets target="_blank"',
      control: "boolean",
    },
    disabled: {
      description: "Disables the link visually and functionally",
      control: "boolean",
    },
    prefetch: {
      description: "Prefetches the page on hover",
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: "#",
    children: "Default Link",
  },
};

export const ButtonVariant: Story = {
  args: {
    href: "#",
    variant: "button",
    children: "Button Link",
  },
};

export const Subtle: Story = {
  args: {
    href: "#",
    variant: "subtle",
    children: "Subtle Link",
  },
};

export const External: Story = {
  args: {
    href: "https://doom.design",
    isExternal: true,
    children: "External Link",
  },
};

export const Disabled: Story = {
  args: {
    href: "#",
    disabled: true,
    children: "Disabled Link",
  },
};
