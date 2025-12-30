import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "../Text";
import { Container, Flex, Grid, Stack, Switcher } from "./Layout";

const meta: Meta<typeof Flex> = {
  title: "Components/Layout",
  component: Flex,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Flex>;

const Box = ({
  children,
  color = "#e0e7ff",
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <div
    style={{
      padding: "1.5rem",
      background: color,
      border: "2px solid #000",
      borderRadius: "4px",
    }}
  >
    <Text>{children}</Text>
  </div>
);

export const FlexRow: Story = {
  render: () => (
    <Flex wrap gap={4}>
      <Box>Flex Item 1</Box>
      <Box>Flex Item 2</Box>
      <Box>Flex Item 3</Box>
    </Flex>
  ),
};

export const VerticalStack: Story = {
  render: () => (
    <Stack gap={4}>
      <Box>Stack Item 1</Box>
      <Box>Stack Item 2</Box>
      <Box>Stack Item 3</Box>
    </Stack>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <Grid columns={3} gap={4}>
      <Box>Grid 1</Box>
      <Box>Grid 2</Box>
      <Box>Grid 3</Box>
      <Box>Grid 4</Box>
      <Box>Grid 5</Box>
      <Box>Grid 6</Box>
    </Grid>
  ),
};

export const ContainerExample: Story = {
  render: () => (
    <Stack gap={8} style={{ background: "#eee", padding: "1rem" }}>
      <Container maxWidth="sm" style={{ border: "2px dashed red" }}>
        <Box color="white">Small Container (sm)</Box>
      </Container>

      <Container maxWidth="md" style={{ border: "2px dashed blue" }}>
        <Box color="white">Medium Container (md)</Box>
      </Container>

      <Container maxWidth="lg" style={{ border: "2px dashed green" }}>
        <Box color="white">Large Container (lg)</Box>
      </Container>
    </Stack>
  ),
};

export const SwitcherLayout: Story = {
  render: () => (
    <Stack gap={8}>
      <Stack gap={2}>
        <Text weight="bold">Switcher (Threshold: sm)</Text>
        <Text color="muted">
          Resize viewport to see layout switch from row to column below small
          breakpoint.
        </Text>
        <Switcher
          gap={4}
          style={{ border: "2px dashed #ccc", padding: "1rem" }}
          threshold="sm"
        >
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item A Long Title</Box>
        </Switcher>
      </Stack>

      <Stack gap={2}>
        <Text weight="bold">Switcher (Threshold: xs)</Text>
        <Text color="muted">Switches at a smaller breakpoint (mobile).</Text>
        <Switcher
          gap={4}
          style={{ border: "2px dashed #999", padding: "1rem" }}
          threshold="xs"
        >
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Switcher>
      </Stack>
    </Stack>
  ),
};
