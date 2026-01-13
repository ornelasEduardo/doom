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

// Rename local helper to DemoBox to avoid confusion if we imported Box
const DemoBox = ({
  children,
  color = "#e0e7ff",
  width,
}: {
  children: React.ReactNode;
  color?: string;
  width?: string | number;
}) => (
  <div
    style={{
      padding: "1.5rem",
      background: color,
      border: "2px solid #000",
      borderRadius: "4px",
      width,
    }}
  >
    <Text>{children}</Text>
  </div>
);

export const FlexRow: Story = {
  render: () => (
    <Flex wrap gap={4}>
      <DemoBox>Flex Item 1</DemoBox>
      <DemoBox>Flex Item 2</DemoBox>
      <DemoBox>Flex Item 3</DemoBox>
    </Flex>
  ),
};

export const VerticalStack: Story = {
  render: () => (
    <Stack gap={4}>
      <DemoBox>Stack Item 1</DemoBox>
      <DemoBox>Stack Item 2</DemoBox>
      <DemoBox>Stack Item 3</DemoBox>
    </Stack>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <Grid columns={3} gap={4}>
      <DemoBox>Grid 1</DemoBox>
      <DemoBox>Grid 2</DemoBox>
      <DemoBox>Grid 3</DemoBox>
      <DemoBox>Grid 4</DemoBox>
      <DemoBox>Grid 5</DemoBox>
      <DemoBox>Grid 6</DemoBox>
    </Grid>
  ),
};

export const ContainerExample: Story = {
  render: () => (
    <Stack gap={8} style={{ background: "#eee", padding: "1rem" }}>
      <Container maxWidth="sm" style={{ border: "2px dashed red" }}>
        <DemoBox color="white">Small Container (sm)</DemoBox>
      </Container>

      <Container maxWidth="md" style={{ border: "2px dashed blue" }}>
        <DemoBox color="white">Medium Container (md)</DemoBox>
      </Container>

      <Container maxWidth="lg" style={{ border: "2px dashed green" }}>
        <DemoBox color="white">Large Container (lg)</DemoBox>
      </Container>
    </Stack>
  ),
};

export const SemanticSizing: Story = {
  render: () => (
    <Stack gap={8} style={{ background: "#f9fafb", padding: "2rem" }}>
      <Stack gap={4}>
        <Text weight="bold">Prose Widths (Reading)</Text>
        <Stack
          style={{
            background: "white",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
          width="prose-narrow"
        >
          <Text weight="medium">Prose Narrow (45ch)</Text>
          <Text color="muted" variant="small">
            Ideal for captions, side notes, or comments.
          </Text>
        </Stack>
        <Stack
          style={{
            background: "white",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
          width="prose"
        >
          <Text weight="medium">Prose Standard (65ch)</Text>
          <Text color="muted" variant="small">
            The gold standard for readability. Use this for main content text
            blocks.
          </Text>
        </Stack>
      </Stack>

      <Stack gap={4}>
        <Text weight="bold">Structural Widths</Text>
        <Flex wrap gap={4}>
          <Stack
            align="center"
            justify="center"
            style={{
              height: "200px",
              background: "#ddd",
              border: "1px dashed #999",
            }}
            width="sidebar"
          >
            Sidebar
          </Stack>
          <Stack
            align="center"
            justify="center"
            style={{
              height: "200px",
              background: "#ddd",
              border: "1px dashed #999",
            }}
            width="panel"
          >
            Panel
          </Stack>
        </Flex>
      </Stack>

      <Stack gap={4}>
        <Text weight="bold">Controls</Text>
        <Flex gap={4}>
          <Stack
            style={{ background: "#e0e7ff", padding: "0.5rem" }}
            width="control-sm"
          >
            SM
          </Stack>
          <Stack
            style={{ background: "#c7d2fe", padding: "0.5rem" }}
            width="control-md"
          >
            MD
          </Stack>
          <Stack
            style={{ background: "#a5b4fc", padding: "0.5rem" }}
            width="control-lg"
          >
            LG
          </Stack>
        </Flex>
      </Stack>
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
          <DemoBox>Item 1</DemoBox>
          <DemoBox>Item 2</DemoBox>
          <DemoBox>Item A Long Title</DemoBox>
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
          <DemoBox>Item 1</DemoBox>
          <DemoBox>Item 2</DemoBox>
          <DemoBox>Item 3</DemoBox>
        </Switcher>
      </Stack>
    </Stack>
  ),
};
