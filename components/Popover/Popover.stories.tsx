import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "./Popover";
import { Button, Card, Text, Page, Flex, Stack } from "doom-design-system";
import { useState } from "react";

const meta: Meta<typeof Popover> = {
  title: "Design System/Popover",
  component: Popover,
  tags: ["autodocs"],
  argTypes: {
    placement: {
      control: "select",
      options: ["bottom-start", "bottom-end", "bottom-center"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Page>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
              <Button onClick={() => setIsOpen(!isOpen)}>Click me</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Popover Content</Text>
                  <Text variant="small">
                    This is some content inside the popover.
                  </Text>
                </Stack>
              </Card>
            }
          />
        </Flex>
      </Page>
    );
  },
};

export const Placements: Story = {
  render: () => {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);

    return (
      <Page>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Flex gap="2rem">
            <Popover
              placement="bottom-start"
              isOpen={isOpen1}
              onClose={() => setIsOpen1(false)}
              trigger={
                <Button onClick={() => setIsOpen1(!isOpen1)}>
                  Bottom Start
                </Button>
              }
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap="0.5rem">
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Aligned to the start.</Text>
                  </Stack>
                </Card>
              }
            />
            <Popover
              placement="bottom-center"
              isOpen={isOpen2}
              onClose={() => setIsOpen2(false)}
              trigger={
                <Button onClick={() => setIsOpen2(!isOpen2)}>
                  Bottom Center
                </Button>
              }
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap="0.5rem">
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Centered alignment.</Text>
                  </Stack>
                </Card>
              }
            />
            <Popover
              placement="bottom-end"
              isOpen={isOpen3}
              onClose={() => setIsOpen3(false)}
              trigger={
                <Button onClick={() => setIsOpen3(!isOpen3)}>Bottom End</Button>
              }
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap="0.5rem">
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Aligned to the end.</Text>
                  </Stack>
                </Card>
              }
            />
          </Flex>
        </Flex>
      </Page>
    );
  },
};

export const EdgeDetection: Story = {
  render: () => {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const [isOpen4, setIsOpen4] = useState(false);
    const [isOpen5, setIsOpen5] = useState(false);

    return (
      <div style={{ height: "200vh", width: "200vw", position: "relative" }}>
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          <Popover
            isOpen={isOpen1}
            onClose={() => setIsOpen1(false)}
            trigger={
              <Button onClick={() => setIsOpen1(!isOpen1)}>Top Left</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Flips down when too close to top edge.
                  </Text>
                </Stack>
              </Card>
            }
          />
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <Popover
            isOpen={isOpen2}
            onClose={() => setIsOpen2(false)}
            trigger={
              <Button onClick={() => setIsOpen2(!isOpen2)}>Top Right</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">Flips down and left when needed.</Text>
                </Stack>
              </Card>
            }
          />
        </div>
        <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
          <Popover
            isOpen={isOpen3}
            onClose={() => setIsOpen3(false)}
            trigger={
              <Button onClick={() => setIsOpen3(!isOpen3)}>Bottom Left</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Flips up when too close to bottom edge.
                  </Text>
                </Stack>
              </Card>
            }
          />
        </div>
        <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
          <Popover
            isOpen={isOpen4}
            onClose={() => setIsOpen4(false)}
            trigger={
              <Button onClick={() => setIsOpen4(!isOpen4)}>Bottom Right</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">Flips up and left when needed.</Text>
                </Stack>
              </Card>
            }
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Popover
            isOpen={isOpen5}
            onClose={() => setIsOpen5(false)}
            trigger={
              <Button onClick={() => setIsOpen5(!isOpen5)}>Center</Button>
            }
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap="0.5rem">
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Scroll to edges to see flipping behavior!
                  </Text>
                </Stack>
              </Card>
            }
          />
        </div>
      </div>
    );
  },
  parameters: {
    layout: "fullscreen",
  },
};
