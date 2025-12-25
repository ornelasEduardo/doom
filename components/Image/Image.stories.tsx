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
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=80",
    alt: "Mountain Landscape",
    style: { width: "300px", height: "auto" },
  },
};

export const FitVariants: Story = {
  render: () => (
    <Grid columns="3" gap={4}>
      <Stack>
        <Text>Cover (200x200)</Text>
        <Image
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80"
          alt="Nature"
          fit="cover"
          style={{ width: "200px", height: "200px", border: "1px solid #ccc" }}
        />
      </Stack>
      <Stack>
        <Text>Contain (200x200)</Text>
        <Image
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80"
          alt="Nature"
          fit="contain"
          style={{ width: "200px", height: "200px", border: "1px solid #ccc" }}
        />
      </Stack>
      <Stack>
        <Text>None (200x200)</Text>
        <Image
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80"
          alt="Nature"
          fit="none"
          style={{ width: "200px", height: "200px", border: "1px solid #ccc" }}
        />
      </Stack>
    </Grid>
  ),
};

export const WithSkeletonLoading: Story = {
  render: () => {
    const [src, setSrc] = useState(
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=600&q=80"
    );

    const [isLoading, setIsLoading] = useState(false);

    const reload = () => {
      setIsLoading(true);
      setSrc("");

      // Artificial delay
      setTimeout(() => {
        const seed = Math.random();
        setSrc(
          `https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=600&q=80&random=${seed}`
        );
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
          alt="Random Nature"
          fit="cover"
          style={{ width: "600px", height: "400px" }}
        />
      </Stack>
    );
  },
};

export const WithFallback: Story = {
  args: {
    src: "https://broken-link-example.com/image.jpg",
    fallbackSrc: "https://placehold.co/600x400?text=Image+not+found",
    alt: "Broken link with fallback",
    style: { width: "300px", height: "auto" },
  },
};

export const WithAspectRatio: Story = {
  render: () => (
    <Stack gap={4}>
      <Text>AspectRatio: 16/9 (Width: 400px)</Text>
      <Image
        src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=80"
        alt="Aspect Ratio Test"
        aspectRatio="16/9"
        fit="cover"
        style={{ width: "400px" }}
      />
      <Text>AspectRatio: 1/1 (Width: 200px)</Text>
      <Image
        src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=80"
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
          src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80"
          alt="Rounded"
          fit="cover"
          style={{ width: "200px", height: "200px" }}
        />
      </Stack>
      <Stack>
        <Text>Not Rounded (rounded=false)</Text>
        <Image
          src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80"
          alt="Not Rounded"
          fit="cover"
          rounded={false}
          style={{ width: "200px", height: "200px" }}
        />
      </Stack>
    </Grid>
  ),
};
