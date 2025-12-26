import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Image } from "./Image";
import { Flex, Grid, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Button } from "../Button/Button";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  tags: ["autodocs"],
  argTypes: {
    fit: {
      control: "select",
      options: ["cover", "contain", "fill", "none", "scale-down"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {
  args: {
    src: "https://picsum.photos/500/300",
    alt: "Randomly generated image from picsum",
    width: 300,
    height: 200,
  },
};

export const FitVariants: Story = {
  render: () => (
    <Grid columns="3" gap={4}>
      <Stack>
        <Text>Cover (200x200)</Text>
        <Image
          src="https://picsum.photos/300/300"
          alt="Randomly generated image from picsum"
          fit="cover"
          width={200}
          height={200}
          style={{ border: "1px solid #ccc" }}
        />
      </Stack>
      <Stack>
        <Text>Contain (200x200)</Text>
        <Image
          src="https://picsum.photos/300/300"
          alt="Randomly generated image from picsum"
          fit="contain"
          width={200}
          height={200}
          style={{ border: "1px solid #ccc" }}
        />
      </Stack>
      <Stack>
        <Text>None (200x200)</Text>
        <Image
          src="https://picsum.photos/300/300"
          alt="Randomly generated image from picsum"
          fit="none"
          width={200}
          height={200}
          style={{ border: "1px solid #ccc" }}
        />
      </Stack>
    </Grid>
  ),
};

export const WithSkeletonLoading: Story = {
  render: () => {
    const [src, setSrc] = useState("https://picsum.photos/600/400");

    const [isLoading, setIsLoading] = useState(false);

    const reload = () => {
      setIsLoading(true);
      setSrc("");

      // Artificial delay
      setTimeout(() => {
        const seed = Math.random();
        setSrc(`https://picsum.photos/600/400?random=${seed}`);
        setIsLoading(false);
      }, 2000);
    };

    return (
      <Stack gap={4} align="flex-start">
        <Text>
          Click reload to simulate a 2-second network delay. The skeleton will
          appear after 150ms, then the image will transition in.
        </Text>
        <Button onClick={reload} loading={isLoading}>
          {isLoading ? "Loading..." : "Reload with Delay"}
        </Button>
        <Image
          key={src} // Reset internal state completely when src changes
          src={src}
          alt="Randomly generated image from picsum"
          fit="cover"
          width={600}
          height={400}
        />
      </Stack>
    );
  },
};

export const WithFallback: Story = {
  args: {
    src: "#",
    fallbackSrc: "https://placehold.co/600x400?text=Image+not+found",
    alt: "Broken link with fallback",
    width: 300,
    height: 200,
  },
};

export const WithAspectRatio: Story = {
  render: () => (
    <Stack gap={4}>
      <Text>AspectRatio: 16/9 (Width: 400px)</Text>
      <Image
        src="https://picsum.photos/500/300"
        alt="Aspect Ratio Test"
        aspectRatio="16/9"
        fit="cover"
        style={{ width: "400px" }}
      />
      <Text>AspectRatio: 1/1 (Width: 200px)</Text>
      <Image
        src="https://picsum.photos/500/300"
        alt="Square"
        aspectRatio={1}
        fit="cover"
        style={{ width: "200px" }}
      />
    </Stack>
  ),
};

export const RoundedVariants: Story = {
  render: () => (
    <Grid columns="2" gap={4}>
      <Stack>
        <Text>Default (Rounded)</Text>
        <Image
          src="https://picsum.photos/300/300"
          alt="Randomly generated image from picsum"
          fit="cover"
          width={200}
          height={200}
        />
      </Stack>
      <Stack>
        <Text>Not Rounded (rounded=false)</Text>
        <Image
          src="https://picsum.photos/300/300"
          alt="Randomly generated image from picsum"
          fit="cover"
          rounded={false}
          width={200}
          height={200}
        />
      </Stack>
    </Grid>
  ),
};
