import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { Button } from "../Button/Button";
import { Grid, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Image } from "./Image";

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
          alt="Randomly generated image from picsum"
          fit="cover"
          height={200}
          src="https://picsum.photos/300/300"
          style={{ border: "1px solid #ccc" }}
          width={200}
        />
      </Stack>
      <Stack>
        <Text>Contain (200x200)</Text>
        <Image
          alt="Randomly generated image from picsum"
          fit="contain"
          height={200}
          src="https://picsum.photos/300/300"
          style={{ border: "1px solid #ccc" }}
          width={200}
        />
      </Stack>
      <Stack>
        <Text>None (200x200)</Text>
        <Image
          alt="Randomly generated image from picsum"
          fit="none"
          height={200}
          src="https://picsum.photos/300/300"
          style={{ border: "1px solid #ccc" }}
          width={200}
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
      <Stack align="flex-start" gap={4}>
        <Text>
          Click reload to simulate a 2-second network delay. The skeleton will
          appear after 150ms, then the image will transition in.
        </Text>
        <Button loading={isLoading} onClick={reload}>
          {isLoading ? "Loading..." : "Reload with Delay"}
        </Button>
        <Image
          key={src} // Reset internal state completely when src changes
          alt="Randomly generated image from picsum"
          fit="cover"
          height={400}
          src={src}
          width={600}
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
        alt="Aspect Ratio Test"
        aspectRatio="16/9"
        fit="cover"
        src="https://picsum.photos/500/300"
        style={{ width: "400px" }}
      />
      <Text>AspectRatio: 1/1 (Width: 200px)</Text>
      <Image
        alt="Square"
        aspectRatio={1}
        fit="cover"
        src="https://picsum.photos/500/300"
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
          alt="Randomly generated image from picsum"
          fit="cover"
          height={200}
          src="https://picsum.photos/300/300"
          width={200}
        />
      </Stack>
      <Stack>
        <Text>Not Rounded (rounded=false)</Text>
        <Image
          alt="Randomly generated image from picsum"
          fit="cover"
          height={200}
          rounded={false}
          src="https://picsum.photos/300/300"
          width={200}
        />
      </Stack>
    </Grid>
  ),
};
