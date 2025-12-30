import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "../Card/Card";
import { Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
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

export const Prefetch: Story = {
  args: {
    href: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=1000&q=80",
    prefetch: true,
    children: "Hover to Prefetch Image",
  },
  render: (args) => (
    <Card
      className="p-5"
      style={{
        maxWidth: "400px",
      }}
    >
      <Stack gap={4}>
        <Stack gap={0}>
          <Text className="mb-0" variant="h5">
            Network Tab Demo
          </Text>
          <Text>
            Hovering the link below will dynamically inject a prefetch tag for a
            high-res image.
          </Text>
        </Stack>
        <Text variant="caption">
          Open your browser&apos;s Network tab (filter by &quot;Other&quot; or
          &quot;Image&quot;) to watch the resource load instantly on hover.
        </Text>
        <div>
          <Link {...args} />
        </div>
      </Stack>
    </Card>
  ),
};
