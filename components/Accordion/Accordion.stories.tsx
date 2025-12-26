import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionItem } from "./Accordion";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Label } from "../Label/Label";
import { Text } from "../Text/Text";
import { Stack } from "../Layout/Layout";
import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";

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
      <Accordion {...args} type="single" defaultValue="item-1">
        <AccordionItem value="item-1" trigger="Is it accessible?">
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionItem>
        <AccordionItem value="item-2" trigger="Is it styled?">
          Yes. It adheres to the neubrutalist design system with hard borders
          and high contrast.
        </AccordionItem>
        <AccordionItem value="item-3" trigger="Is it filterable?">
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
      <Accordion {...args} type="multiple" defaultValue={["item-1", "item-2"]}>
        <AccordionItem value="item-1" trigger="Notifications">
          Manage your email and push notification settings.
        </AccordionItem>
        <AccordionItem value="item-2" trigger="Privacy">
          Choose what data you share with the community.
        </AccordionItem>
        <AccordionItem value="item-3" trigger="Security">
          Update your password and 2FA settings.
        </AccordionItem>
        <AccordionItem value="item-4" trigger="Billing">
          Manage your subscription and payment methods.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const ProjectDashboard: Story = {
  render: (args) => (
    <div style={{ width: "500px" }}>
      <Accordion {...args} type="single" defaultValue="item-1">
        <AccordionItem value="item-1" trigger="Mission Brief">
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
        <AccordionItem value="item-2" trigger="Active Squadron">
          <Stack gap={4}>
            <Stack direction="row" align="center" justify="space-between">
              <Stack direction="row" gap={4} align="center">
                <Avatar fallback="DD" size="sm" />
                <Text>Daredevil</Text>
              </Stack>
              <Badge variant="success">Online</Badge>
            </Stack>
            <Stack direction="row" align="center" justify="space-between">
              <Stack direction="row" gap={4} align="center">
                <Avatar fallback="SM" size="sm" />
                <Text>Spiderman</Text>
              </Stack>
              <Badge variant="success">Online</Badge>
            </Stack>
            <Stack direction="row" align="center" justify="space-between">
              <Stack direction="row" gap={4} align="center">
                <Avatar fallback="RO" size="sm" />
                <Text>Rogue</Text>
              </Stack>
              <Badge variant="secondary">Offline</Badge>
            </Stack>
          </Stack>
        </AccordionItem>
        <AccordionItem value="item-3" trigger="System Status">
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
