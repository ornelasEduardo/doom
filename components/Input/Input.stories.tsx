import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { useState } from "react";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    helperText: { control: "text" },
    showCount: { control: "boolean" },
    maxLength: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Username",
    placeholder: "Enter username",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    value: "invalid-email",
    error: "Please enter a valid email address",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Password",
    type: "password",
    helperText: "Must be at least 8 characters",
  },
};

export const WithStartAdornment: Story = {
  args: {
    label: "Price",
    startAdornment: "$",
    placeholder: "0.00",
  },
};

export const WithEndAdornment: Story = {
  args: {
    label: "Weight",
    endAdornment: "kg",
    placeholder: "0",
  },
};

export const Required: Story = {
  args: {
    label: "Required Field",
    required: true,
    placeholder: "This field has an asterisk",
  },
};

export const WithCharacterCounter: Story = {
  args: {
    label: "Post Content",
    placeholder: "What is on your mind?",
    maxLength: 280,
  },
};
export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "You cannot type here",
    disabled: true,
  },
};
