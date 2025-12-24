import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The text content of the label",
    },
    htmlFor: {
      control: "text",
      description: "ID of the form element this label controls",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Email Address",
    htmlFor: "email",
  },
};

export const Required: Story = {
  args: {
    children: "Password *",
    htmlFor: "password",
  },
};

export const LongText: Story = {
  args: {
    children:
      "This is a very long label description for a complex input field that needs explanation",
    htmlFor: "complex",
  },
};

import { Input } from "../Input/Input";

export const WithInput: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "300px",
      }}
    >
      <Label htmlFor="demo-input">Username</Label>
      <Input id="demo-input" placeholder="Enter username..." />
    </div>
  ),
};
