import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Text } from "../Text/Text";
import { Stack, Flex } from "../Layout/Layout";
import { Link } from "../Link/Link";
import { Badge } from "../Badge/Badge";
import { Image } from "../Image/Image";

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
            Some more text that we're adding here lorem ipsum dolor sit amet
            consectetur adipisicing elit. Lorem ipsum dolor sit amet consectetur
            adipisicing elit. Modi pariatur veritatis tempore, explicabo autem
            beatae saepe! Tenetur aliquid, obcaecati quasi, soluta cupiditate
            exercitationem excepturi, quas perferendis repellat error doloremque
            non?
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
          src="https://picsum.photos/600/500"
          alt="Randomly generated image from picsum"
          fit="cover"
          rounded={false}
          style={{
            width: "100%",
            height: "250px",
          }}
        />
        <Stack gap={2} className="p-5">
          <Flex justify="space-between" align="flex-end">
            <Text variant="small" color="muted">
              Dec 2025
            </Text>
          </Flex>
          <Text variant="h3" className="mb-0">
            Randomly image Card
          </Text>
          <Text>
            Cards are excellent containers for showcasing images alongside
            descriptive text.
          </Text>
          <Flex gap={2} wrap>
            <Badge variant="primary" size="sm">
              Photography
            </Badge>
            <Badge variant="success" size="sm">
              Random
            </Badge>
            <Badge variant="secondary" size="sm">
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
        src="https://picsum.photos/300/450"
        alt="Randomly generated image from picsum"
        fit="cover"
        rounded={false}
        style={{
          width: "100%",
          height: "450px",
        }}
      />
    ),
  },
};
