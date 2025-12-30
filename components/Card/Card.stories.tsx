import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../Badge/Badge";
import { Image } from "../Image/Image";
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    style: { height: "400px" },
    children: (
      <Stack gap={1}>
        <Text variant="h3">Card Title</Text>
        <Stack style={{ maxHeight: "300px", overflow: "scroll" }}>
          <Text>
            This is some content inside the card. Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Lorem ipsum, dolor sit amet
            consectetur adipisicing elit. Modi pariatur veritatis tempore,
            explicabo autem beatae saepe! Tenetur aliquid, obcaecati quasi,
            soluta cupiditate exercitationem excepturi, quas perferendis
            repellat error doloremque non?
          </Text>
          <Text>
            Some more text that we&apos;re adding here lorem ipsum dolor sit
            amet consectetur adipisicing elit. Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Modi pariatur veritatis tempore,
            explicabo autem beatae saepe! Tenetur aliquid, obcaecati quasi,
            soluta cupiditate exercitationem excepturi, quas perferendis
            repellat error doloremque non?
          </Text>
        </Stack>
      </Stack>
    ),
  },
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-full p-0" style={{ overflow: "hidden" }}>
      <Stack gap={0}>
        <Image
          alt="Randomly generated image from picsum"
          fit="cover"
          rounded={false}
          src="https://picsum.photos/600/500"
          style={{
            width: "100%",
            height: "250px",
          }}
        />
        <Stack className="p-5" gap={2}>
          <Flex align="flex-end" justify="space-between">
            <Text color="muted" variant="small">
              Dec 2025
            </Text>
          </Flex>
          <Text className="mb-0" variant="h3">
            Randomly image Card
          </Text>
          <Text>
            Cards are excellent containers for showcasing images alongside
            descriptive text.
          </Text>
          <Flex wrap gap={2}>
            <Badge size="sm" variant="primary">
              Photography
            </Badge>
            <Badge size="sm" variant="success">
              Random
            </Badge>
            <Badge size="sm" variant="secondary">
              What could it be?
            </Badge>
          </Flex>
        </Stack>
      </Stack>
    </Card>
  ),
};

export const ImageOnly: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "300px", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    className: "p-0",
    style: { overflow: "hidden" },
    children: (
      <Image
        alt="Randomly generated image from picsum"
        fit="cover"
        rounded={false}
        src="https://picsum.photos/300/450"
        style={{
          width: "100%",
          height: "450px",
        }}
      />
    ),
  },
};
