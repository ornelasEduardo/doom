import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Design System/Textarea",
  component: Textarea,
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
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Bio",
    placeholder: "Tell us about yourself",
  },
};

export const Required: Story = {
  args: {
    label: "Required Feedback",
    required: true,
    placeholder: "Please provide your feedback",
  },
};

export const WithError: Story = {
  args: {
    label: "Comments",
    placeholder: "Enter comments",
    error: "This field is required",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Description",
    placeholder: "Enter description",
    helperText: "A detailed description is helpful for our team.",
  },
};

export const WithCharacterCounter: Story = {
  args: {
    label: "Tweet",
    placeholder: "What's happening?",
    maxLength: 280,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    placeholder: "This field is currently inactive",
    disabled: true,
  },
};
