import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "../Card";
import { Flex } from "../Layout";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Rectangular: Story = {
  args: {
    variant: "rectangular",
    width: "300px",
    height: "150px",
  },
};

export const Circular: Story = {
  args: {
    variant: "circular",
    width: "64px",
    height: "64px",
  },
};

export const Text: Story = {
  render: () => (
    <div style={{ width: "300px" }}>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </div>
  ),
};

export const CardLoading: Story = {
  render: () => (
    <Card style={{ width: "350px" }}>
      <Flex align="center" gap={4} style={{ marginBottom: "1rem" }}>
        <Skeleton height="48px" variant="circular" width="48px" />
        <div style={{ flex: 1 }}>
          <Skeleton
            style={{ marginBottom: "0.5rem" }}
            variant="text"
            width="60%"
          />
          <Skeleton variant="text" width="40%" />
        </div>
      </Flex>
      <Skeleton
        height="120px"
        style={{ marginBottom: "1rem" }}
        variant="rectangular"
      />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </Card>
  ),
};
