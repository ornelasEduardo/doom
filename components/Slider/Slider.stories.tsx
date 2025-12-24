import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    label: "System Volume",
    showValue: true,
    defaultValue: 50,
  },
};

export const Controlled: Story = {
  render: () => {
    // Cast to number because this specific story uses a single number
    const [val, setVal] = useState<number | [number, number]>(25);

    return (
      <Slider
        label="Controlled Value"
        value={val}
        onChange={(v) => setVal(v)} // Simple pass through
        showValue
      />
    );
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<number | [number, number]>([20, 80]);
    return (
      <Slider
        label="Power Distribution (kV)"
        value={range}
        onChange={setRange}
        showValue
        min={0}
        max={100}
      />
    );
  },
};

export const Steps: Story = {
  args: {
    label: "Sector Alignment",
    step: 10,
    defaultValue: 0,
    showValue: true,
  },
};
