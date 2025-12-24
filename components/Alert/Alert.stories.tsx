import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "error"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: "info",
    title: "Note",
    description: "This serves as a neutral piece of information for the user.",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    title: "Success",
    description: "The operation completed successfully without errors.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Warning",
    description:
      "Please be careful with this action as it may have side effects.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Error",
    description: "Something went wrong. Please try again later.",
  },
};

export const TitleOnly: Story = {
  args: {
    variant: "info",
    title: "Short Announcement",
  },
};
