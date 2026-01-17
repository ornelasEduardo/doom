import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
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
    children: (
      <Stack gap={1}>
        <Text variant="h3">Card Title</Text>
        <Stack style={{ maxHeight: "300px", overflow: "scroll" }}>
          <Text>
            This is a standard card. It uses the default <code>Card</code>{" "}
            wrapper which adds padding automatically.
          </Text>
          <Text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi
            pariatur veritatis tempore, explicabo autem beatae saepe!
          </Text>
        </Stack>
      </Stack>
    ),
  },
};

export const Composition: Story = {
  render: () => (
    <Card.Root>
      <Card.Header>
        <Flex align="center" justify="space-between">
          <Text variant="h4">Composed Card</Text>
          <Badge variant="success">Active</Badge>
        </Flex>
      </Card.Header>
      <Card.Body>
        <Stack gap={2}>
          <Text>
            This card uses structure composition:
            <code>{"<Card.Root>"}</code>,<code>{"<Card.Header>"}</code>,
            <code>{"<Card.Body>"}</code>, and <code>{"<Card.Footer>"}</code>.
          </Text>
          <Text>
            This provides consistent borders and spacing for advanced layouts.
          </Text>
        </Stack>
      </Card.Body>
      <Card.Footer>
        <Flex gap={2} justify="flex-end">
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Button size="sm">Save Changes</Button>
        </Flex>
      </Card.Footer>
    </Card.Root>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card.Root>
      <div
        style={{
          width: "100%",
          height: "250px",
          overflow: "hidden",
        }}
      >
        <Image
          alt="Randomly generated image from picsum"
          fit="cover"
          rounded={false}
          src="https://picsum.photos/seed/doom-card-1/600/500"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <Card.Body>
        <Stack gap={2}>
          <Flex align="flex-end" justify="space-between">
            <Text color="muted" variant="small">
              Dec 2025
            </Text>
          </Flex>
          <Text variant="h3">Full Bleed Image</Text>
          <Text>
            By using <code>Card.Root</code> (which has no padding), we can
            easily insert full-width images without negative margin hacks.
          </Text>
          <Flex wrap gap={2}>
            <Badge size="sm" variant="primary">
              Photography
            </Badge>
            <Badge size="sm" variant="secondary">
              Travel
            </Badge>
          </Flex>
        </Stack>
      </Card.Body>
    </Card.Root>
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
  render: () => (
    <Card.Root>
      <Image
        alt="Randomly generated image from picsum"
        fit="cover"
        rounded={false}
        src="https://picsum.photos/seed/doom-card-2/300/450"
        style={{
          width: "100%",
          height: "450px",
        }}
      />
    </Card.Root>
  ),
};
