import type { Meta, StoryObj } from "@storybook/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import React, { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Text alignment"
      defaultValue="center"
      type="single"
    >
      <ToggleGroupItem aria-label="Align left" value="left">
        <AlignLeft size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Align center" value="center">
        <AlignCenter size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Align right" value="right">
        <AlignRight size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Text formatting"
      defaultValue={["bold"]}
      type="multiple"
    >
      <ToggleGroupItem aria-label="Bold" value="bold">
        <Bold size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Italic" value="italic">
        <Italic size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Underline" value="underline">
        <Underline size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <ToggleGroup aria-label="Text formatting" defaultValue="bold" type="single">
      <ToggleGroupItem value="bold">
        <Bold size={16} strokeWidth={2.5} /> Bold
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Italic size={16} strokeWidth={2.5} /> Italic
      </ToggleGroupItem>
      <ToggleGroupItem value="underline">
        <Underline size={16} strokeWidth={2.5} /> Underline
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <ToggleGroup
        aria-label="Small"
        defaultValue="bold"
        size="sm"
        type="single"
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        aria-label="Medium"
        defaultValue="bold"
        size="md"
        type="single"
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        aria-label="Large"
        defaultValue="bold"
        size="lg"
        type="single"
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup
      disabled
      aria-label="Disabled group"
      defaultValue="bold"
      type="single"
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("left");
    return (
      <div>
        <ToggleGroup
          aria-label="Controlled alignment"
          type="single"
          value={value}
          onValueChange={(v) => setValue(v as string)}
        >
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
        <p style={{ marginTop: "var(--space-4)" }}>
          Selected: {value || "none"}
        </p>
      </div>
    );
  },
};
