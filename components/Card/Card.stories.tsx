import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Text } from "../Text/Text";
import { Stack, Flex } from "../Layout/Layout";
import { Link } from "../Link/Link";
import { Badge } from "../Badge/Badge";

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
      <Stack gap="0.5rem">
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
  args: {
    children: (
      <Stack gap="1rem">
        <img
          src="https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Nature Landscape"
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            borderRadius: "var(--radius)",
          }}
        />
        <Stack gap="0.5rem" align="flex-start">
          <Flex gap="0.5rem">
            <Badge variant="primary" size="sm">
              Nature
            </Badge>
            <Badge variant="secondary" size="sm">
              Travel
            </Badge>
            <Badge variant="warning" size="sm">
              Photography
            </Badge>
          </Flex>
          <Text variant="h3">Nature Card</Text>
          <Text>
            Cards are excellent containers for showcasing images alongside
            descriptive text.
          </Text>
          <Link href="https://unsplash.com/photos/KonWFWUaAuk" isExternal>
            Photo by Ken Cheung on Unsplash
          </Link>
        </Stack>
      </Stack>
    ),
  },
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
    className: "p-1",
    children: (
      <img
        src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=300&h=450&q=80"
        alt="Forest Path"
        style={{
          width: "100%",
          height: "450px",
          objectFit: "cover",
          display: "block",
        }}
      />
    ),
  },
};
