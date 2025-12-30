import type { Meta, StoryObj } from "@storybook/react";

import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";
import { Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Accordion, AccordionItem } from "./Accordion";

const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "radio",
      options: ["single", "multiple"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: (args) => (
    <div style={{ width: "400px" }}>
      <Accordion {...args} defaultValue="item-1" type="single">
        <AccordionItem trigger="Is it accessible?" value="item-1">
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionItem>
        <AccordionItem trigger="Is it styled?" value="item-2">
          Yes. It adheres to the neubrutalist design system with hard borders
          and high contrast.
        </AccordionItem>
        <AccordionItem trigger="Is it filterable?" value="item-3">
          Not inherently. This leads into the Combobox pattern for searchable
          lists.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Multiple: Story = {
  render: (args) => (
    <div style={{ width: "400px" }}>
      <Accordion {...args} defaultValue={["item-1", "item-2"]} type="multiple">
        <AccordionItem trigger="Notifications" value="item-1">
          Manage your email and push notification settings.
        </AccordionItem>
        <AccordionItem trigger="Privacy" value="item-2">
          Choose what data you share with the community.
        </AccordionItem>
        <AccordionItem trigger="Security" value="item-3">
          Update your password and 2FA settings.
        </AccordionItem>
        <AccordionItem trigger="Billing" value="item-4">
          Manage your subscription and payment methods.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const ProjectDashboard: Story = {
  render: (args) => (
    <div style={{ width: "500px" }}>
      <Accordion {...args} defaultValue="item-1" type="single">
        <AccordionItem trigger="Mission Brief" value="item-1">
          <Stack gap={4}>
            <Text>
              Objective: Secure the perimeter and establish a forward operating
              base. All agents are authorized to use necessary force.
            </Text>
            <Stack direction="row" gap={2}>
              <Badge variant="warning">Classified</Badge>
              <Badge variant="error">High Priority</Badge>
            </Stack>
          </Stack>
        </AccordionItem>
        <AccordionItem trigger="Active Squadron" value="item-2">
          <Stack gap={4}>
            <Stack align="center" direction="row" justify="space-between">
              <Stack align="center" direction="row" gap={4}>
                <Avatar fallback="DD" size="sm" />
                <Text>Daredevil</Text>
              </Stack>
              <Badge variant="success">Online</Badge>
            </Stack>
            <Stack align="center" direction="row" justify="space-between">
              <Stack align="center" direction="row" gap={4}>
                <Avatar fallback="SM" size="sm" />
                <Text>Spiderman</Text>
              </Stack>
              <Badge variant="success">Online</Badge>
            </Stack>
            <Stack align="center" direction="row" justify="space-between">
              <Stack align="center" direction="row" gap={4}>
                <Avatar fallback="RO" size="sm" />
                <Text>Rogue</Text>
              </Stack>
              <Badge variant="secondary">Offline</Badge>
            </Stack>
          </Stack>
        </AccordionItem>
        <AccordionItem trigger="System Status" value="item-3">
          <Stack gap={4}>
            <Stack direction="row" justify="space-between">
              <Text>Mainframe</Text>
              <Badge variant="success">Operational</Badge>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text>Firewall</Text>
              <Badge variant="warning">Under Attack</Badge>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text>Database</Text>
              <Badge variant="success">Synced</Badge>
            </Stack>
          </Stack>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
