import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: "Toggle me",
  },
};

export const Checked: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(true);
    return <Switch {...args} checked={checked} onChange={setChecked} />;
  },
  args: {
    label: "Checked state",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: "Disabled switch",
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    label: "Disabled checked",
  },
};
