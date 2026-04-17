import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Skull, Star, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { Rating } from "./Rating";

const meta: Meta<typeof Rating> = {
  title: "Components/Rating",
  component: Rating,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    icon: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Default: Story = {
  args: {
    defaultValue: 3,
    "aria-label": "Rating",
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Rating defaultValue={3} size="sm" aria-label="Small rating" />
      <Rating defaultValue={3} size="md" aria-label="Medium rating" />
      <Rating defaultValue={3} size="lg" aria-label="Large rating" />
    </div>
  ),
};

export const HalfValues: Story = {
  args: {
    defaultValue: 2.5,
    allowHalf: true,
    "aria-label": "Half value rating",
  },
};

export const CustomIcon: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Rating defaultValue={3} icon={Heart} aria-label="Heart rating" />
      <Rating defaultValue={4} icon={Skull} aria-label="Skull rating" />
      <Rating defaultValue={2} icon={ThumbsUp} aria-label="Thumbs up rating" />
    </div>
  ),
};

export const CustomCount: Story = {
  args: {
    defaultValue: 7,
    count: 10,
    "aria-label": "Rating out of 10",
  },
};

export const ReadOnly: Story = {
  args: {
    value: 4.5,
    readOnly: true,
    allowHalf: true,
    "aria-label": "4.5 out of 5",
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 3,
    disabled: true,
    "aria-label": "Disabled rating",
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(2);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Rating value={value} onValueChange={setValue} aria-label="Controlled rating" />
        <div style={{ fontFamily: "monospace" }}>Current value: {value}</div>
      </div>
    );
  },
};
