import type { Meta, StoryObj } from "@storybook/react";

import { Flex, Stack } from "../Layout";
import { Text } from "../Text";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  title: "Components/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex align="center" gap={8}>
      <Stack align="center" gap={2}>
        <Spinner size="sm" />
        <Text variant="small">Small</Text>
      </Stack>
      <Stack align="center" gap={2}>
        <Spinner size="md" />
        <Text variant="small">Medium</Text>
      </Stack>
      <Stack align="center" gap={2}>
        <Spinner size="lg" />
        <Text variant="small">Large</Text>
      </Stack>
      <Stack align="center" gap={2}>
        <Spinner size="xl" />
        <Text variant="small">Extra Large</Text>
      </Stack>
    </Flex>
  ),
};
