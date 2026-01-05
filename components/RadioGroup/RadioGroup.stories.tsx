import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState("option-1");
    return (
      <RadioGroup name="example" value={value} onValueChange={setValue}>
        <RadioGroupItem value="option-1">Default Option</RadioGroupItem>
        <RadioGroupItem value="option-2">Second Option</RadioGroupItem>
        <RadioGroupItem disabled value="option-3">
          Disabled Option
        </RadioGroupItem>
      </RadioGroup>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <RadioGroup defaultValue="apple" name="fruits">
      <RadioGroupItem value="apple">Apple</RadioGroupItem>
      <RadioGroupItem value="banana">Banana</RadioGroupItem>
      <RadioGroupItem value="orange">Orange</RadioGroupItem>
    </RadioGroup>
  ),
};
