import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

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
  render: function Render() {
    // Cast to number because this specific story uses a single number
    const [val, setVal] = useState<number | [number, number]>(25);

    return (
      <Slider
        showValue
        label="Controlled Value"
        value={val}
        onChange={(v) => setVal(v)} // Simple pass through
      />
    );
  },
};

export const Range: Story = {
  render: function Render() {
    const [range, setRange] = useState<number | [number, number]>([20, 80]);
    return (
      <Slider
        showValue
        label="Power Distribution (kV)"
        max={100}
        min={0}
        value={range}
        onChange={setRange}
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
