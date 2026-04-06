import type { Meta, StoryObj } from "@storybook/react";

import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
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
    <ToggleGroup type="single" defaultValue="center" aria-label="Text alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Text formatting">
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline size={16} strokeWidth={2.5} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Primary: Story = {
  render: () => (
    <ToggleGroup type="single" variant="primary" defaultValue="bold" aria-label="Text formatting">
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

export const Outline: Story = {
  render: () => (
    <ToggleGroup type="single" variant="outline" defaultValue="bold" aria-label="Text formatting">
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <ToggleGroup type="single" size="sm" defaultValue="bold" aria-label="Small">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="md" defaultValue="bold" aria-label="Medium">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="lg" defaultValue="bold" aria-label="Large">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="single" disabled defaultValue="bold" aria-label="Disabled group">
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
          type="single"
          value={value}
          onValueChange={(v) => setValue(v as string)}
          aria-label="Controlled alignment"
        >
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
        <p style={{ marginTop: "var(--space-4)" }}>Selected: {value || "none"}</p>
      </div>
    );
  },
};
