import type { Meta, StoryObj } from "@storybook/react";
import { Button, Card, Flex, Page, Stack, Text } from "doom-design-system";
import { useState } from "react";

import { Popover } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
  argTypes: {
    placement: {
      control: "select",
      options: [
        "bottom-start",
        "bottom-center",
        "bottom-end",
        "top-start",
        "top-center",
        "top-end",
        "right-start",
        "right-center",
        "right-end",
        "left-start",
        "left-center",
        "left-end",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Page>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Popover
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Popover Content</Text>
                  <Text variant="small">
                    This is some content inside the popover.
                  </Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen}
            trigger={
              <Button onClick={() => setIsOpen(!isOpen)}>Click me</Button>
            }
            onClose={() => setIsOpen(false)}
          />
        </Flex>
      </Page>
    );
  },
};

export const Placements: Story = {
  render: function Render() {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);

    return (
      <Page>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Flex gap={8}>
            <Popover
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap={2}>
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Aligned to the start.</Text>
                  </Stack>
                </Card>
              }
              isOpen={isOpen1}
              placement="bottom-start"
              trigger={
                <Button onClick={() => setIsOpen1(!isOpen1)}>
                  Bottom Start
                </Button>
              }
              onClose={() => setIsOpen1(false)}
            />
            <Popover
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap={2}>
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Centered alignment.</Text>
                  </Stack>
                </Card>
              }
              isOpen={isOpen2}
              placement="bottom-center"
              trigger={
                <Button onClick={() => setIsOpen2(!isOpen2)}>
                  Bottom Center
                </Button>
              }
              onClose={() => setIsOpen2(false)}
            />
            <Popover
              content={
                <Card style={{ padding: "1rem", width: "200px" }}>
                  <Stack gap={2}>
                    <Text weight="bold">Popover Content</Text>
                    <Text variant="small">Aligned to the end.</Text>
                  </Stack>
                </Card>
              }
              isOpen={isOpen3}
              placement="bottom-end"
              trigger={
                <Button onClick={() => setIsOpen3(!isOpen3)}>Bottom End</Button>
              }
              onClose={() => setIsOpen3(false)}
            />
          </Flex>
        </Flex>
      </Page>
    );
  },
};

export const AllPlacements: Story = {
  render: function Render() {
    type Placement =
      | "bottom-start"
      | "bottom-center"
      | "bottom-end"
      | "top-start"
      | "top-center"
      | "top-end"
      | "right-start"
      | "right-center"
      | "right-end"
      | "left-start"
      | "left-center"
      | "left-end";

    const placements: Placement[] = [
      "top-start",
      "top-center",
      "top-end",
      "right-start",
      "right-center",
      "right-end",
      "bottom-start",
      "bottom-center",
      "bottom-end",
      "left-start",
      "left-center",
      "left-end",
    ];

    const [openPlacement, setOpenPlacement] = useState<Placement | null>(null);

    return (
      <Page>
        <Flex
          align="center"
          justify="center"
          style={{ minHeight: "600px", padding: "8rem" }}
        >
          <Flex direction="column" gap={3}>
            {[0, 1, 2, 3].map((row) => (
              <Flex key={row} gap={3}>
                {placements.slice(row * 3, row * 3 + 3).map((placement) => (
                  <Popover
                    key={placement}
                    content={
                      <Card style={{ padding: "1rem", width: "180px" }}>
                        <Stack gap={2}>
                          <Text weight="bold">{placement}</Text>
                          <Text variant="small">
                            Popover anchored {placement.replace("-", " ")}.
                          </Text>
                        </Stack>
                      </Card>
                    }
                    isOpen={openPlacement === placement}
                    placement={placement}
                    trigger={
                      <Button
                        onClick={() =>
                          setOpenPlacement(
                            openPlacement === placement ? null : placement,
                          )
                        }
                      >
                        {placement}
                      </Button>
                    }
                    onClose={() => setOpenPlacement(null)}
                  />
                ))}
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Page>
    );
  },
};

export const EdgeDetection: Story = {
  render: function Render() {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const [isOpen4, setIsOpen4] = useState(false);
    const [isOpen5, setIsOpen5] = useState(false);

    return (
      <div style={{ height: "200vh", width: "200vw", position: "relative" }}>
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          <Popover
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Flips down when too close to top edge.
                  </Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen1}
            trigger={
              <Button onClick={() => setIsOpen1(!isOpen1)}>Top Left</Button>
            }
            onClose={() => setIsOpen1(false)}
          />
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <Popover
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">Flips down and left when needed.</Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen2}
            trigger={
              <Button onClick={() => setIsOpen2(!isOpen2)}>Top Right</Button>
            }
            onClose={() => setIsOpen2(false)}
          />
        </div>
        <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
          <Popover
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Flips up when too close to bottom edge.
                  </Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen3}
            trigger={
              <Button onClick={() => setIsOpen3(!isOpen3)}>Bottom Left</Button>
            }
            onClose={() => setIsOpen3(false)}
          />
        </div>
        <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
          <Popover
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">Flips up and left when needed.</Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen4}
            trigger={
              <Button onClick={() => setIsOpen4(!isOpen4)}>Bottom Right</Button>
            }
            onClose={() => setIsOpen4(false)}
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
            content={
              <Card style={{ padding: "1rem", width: "200px" }}>
                <Stack gap={2}>
                  <Text weight="bold">Edge Detection</Text>
                  <Text variant="small">
                    Scroll to edges to see flipping behavior!
                  </Text>
                </Stack>
              </Card>
            }
            isOpen={isOpen5}
            trigger={
              <Button onClick={() => setIsOpen5(!isOpen5)}>Center</Button>
            }
            onClose={() => setIsOpen5(false)}
          />
        </div>
      </div>
    );
  },
  parameters: {
    layout: "fullscreen",
  },
};
