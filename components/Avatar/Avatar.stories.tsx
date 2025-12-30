import type { Meta, StoryObj } from "@storybook/react";
import { User } from "lucide-react";

import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
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
    fallback: <User size={24} strokeWidth={2.5} />,
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
    fallback: <User size={32} strokeWidth={2.5} />,
    size: "lg",
    shape: "circle",
  },
};
