import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "doom-design-system";
import { Text } from "doom-design-system";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Text variant="h3">Card Title</Text>
        <Text>This is some content inside the card.</Text>
      </>
    ),
  },
};
