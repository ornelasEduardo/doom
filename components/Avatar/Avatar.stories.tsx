import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";
import { User } from "lucide-react";

const meta: Meta<typeof Avatar> = {
  title: "Design System/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    shape: {
      control: "radio",
      options: ["circle", "square"],
    },
    src: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    fallback: <User strokeWidth={2.5} size={24} />,
    size: "md",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://github.com/shadcn.png",
    fallback: <User strokeWidth={2.5} />,
    size: "md",
  },
};

export const Initials: Story = {
  args: {
    fallback: "JD",
    size: "md",
  },
};

export const Circle: Story = {
  args: {
    fallback: <User strokeWidth={2.5} size={32} />,
    size: "lg",
    shape: "circle",
  },
};
