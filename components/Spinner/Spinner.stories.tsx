import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";
import { Flex, Stack } from "../Layout";
import { Text } from "../Text";

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
    <Flex gap={8} align="center">
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
