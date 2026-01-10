import type { Meta, StoryObj } from "@storybook/react";
import {
  Bell,
  History,
  Power,
  Settings2,
  Shield,
  Target,
  User,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import { ActionRow } from "../ActionRow/ActionRow";
import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Flex, Stack } from "../Layout/Layout";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Select } from "../Select/Select";
import { Slider } from "../Slider/Slider";
import { Switch } from "../Switch/Switch";
import { Text } from "../Text/Text";
import { Drawer } from "./Drawer";

const meta: Meta<typeof Drawer> = {
  title: "Components/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "radio",
      options: ["left", "right"],
    },
    variant: {
      control: "radio",
      options: ["default", "solid"],
    },
    isOpen: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const RightSideWithFooter: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <User size={18} />
            View Account
          </Flex>
        </Button>
        <Drawer
          {...args}
          footer={
            <Button
              style={{ width: "100%" }}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Sign Out
            </Button>
          }
          isOpen={open}
          title="Account Profile"
          onClose={() => setOpen(false)}
        >
          <Stack gap={8}>
            <Flex align="center" direction="column" gap={4}>
              <Avatar fallback="PP" shape="circle" size="xl" />
              <Stack gap={1} style={{ textAlign: "center" }}>
                <Text variant="h4" weight="bold">
                  Peter Parker
                </Text>
                <Text color="muted">Lead Technical Researcher</Text>
              </Stack>
              <Flex gap={2}>
                <Badge variant="success">Active</Badge>
                <Badge variant="primary">Pro Plan</Badge>
              </Flex>
            </Flex>

            <Stack gap={4}>
              <Text
                color="muted"
                style={{ textTransform: "uppercase" }}
                variant="small"
                weight="bold"
              >
                Performance Metrics
              </Text>
              <Stack gap={2}>
                <Flex justify="space-between">
                  <Text variant="small">Project Completion</Text>
                  <Text variant="small" weight="bold">
                    92%
                  </Text>
                </Flex>
                <ProgressBar color="var(--primary)" height="12px" value={92} />
              </Stack>
              <Stack gap={2}>
                <Flex justify="space-between">
                  <Text variant="small">Code Quality Score</Text>
                  <Text variant="small" weight="bold">
                    98%
                  </Text>
                </Flex>
                <ProgressBar
                  color="var(--secondary)"
                  height="12px"
                  value={98}
                />
              </Stack>
            </Stack>

            <Stack gap={3}>
              <Text
                color="muted"
                style={{ textTransform: "uppercase" }}
                variant="small"
                weight="bold"
              >
                Recent Contributions
              </Text>
              <ActionRow
                description="Merged 12 components into main branch."
                icon={<Target size={20} />}
                title="Design System"
              />
              <ActionRow
                description="Reduced bundle size by 15%."
                icon={<Zap size={20} />}
                title="Performance Optimization"
              />
            </Stack>
          </Stack>
        </Drawer>
      </>
    );
  },
};

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <Settings2 size={18} />
            User Settings
          </Flex>
        </Button>
        <Drawer
          {...args}
          isOpen={open}
          title="Settings"
          onClose={() => setOpen(false)}
        >
          <Stack gap={6}>
            <Stack gap={4}>
              <Text
                color="muted"
                style={{ textTransform: "uppercase" }}
                variant="small"
                weight="bold"
              >
                Regional
              </Text>
              <Select
                defaultValue="en-us"
                label="Language"
                options={[
                  { label: "English (US)", value: "en-us" },
                  { label: "Spanish (ES)", value: "es" },
                  { label: "French (FR)", value: "fr" },
                ]}
              />
              <Slider defaultValue={100} label="Interface Scale" />
            </Stack>

            <Stack gap={4}>
              <Text
                color="muted"
                style={{ textTransform: "uppercase" }}
                variant="small"
                weight="bold"
              >
                Preferences
              </Text>
              <Flex align="center" justify="space-between">
                <Stack gap={0}>
                  <Text weight="medium">Push Notifications</Text>
                  <Text color="muted" variant="small">
                    Receive desktop alerts
                  </Text>
                </Stack>
                <Switch
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                />
              </Flex>
              <Flex align="center" justify="space-between">
                <Stack gap={0}>
                  <Text weight="medium">Dark Mode</Text>
                  <Text color="muted" variant="small">
                    Use high-contrast theme
                  </Text>
                </Stack>
                <Switch checked={darkMode} onChange={setDarkMode} />
              </Flex>
            </Stack>
          </Stack>
        </Drawer>
      </>
    );
  },
};

export const LeftSide: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <Bell size={18} />
            Notifications
          </Flex>
        </Button>
        <Drawer
          {...args}
          isOpen={open}
          side="left"
          title="Activity Feed"
          onClose={() => setOpen(false)}
        >
          <Stack gap={4} style={{ margin: "-1rem" }}>
            <ActionRow
              description="Your account was successfully verified."
              icon={<Shield size={20} style={{ color: "black" }} />}
              title="Identity Verified"
            />
            <ActionRow
              description="Last cloud sync 5 minutes ago."
              icon={<History size={20} style={{ color: "black" }} />}
              title="Security Backup"
            />
            <ActionRow
              description="You have reached 80% of your api limit."
              icon={<Zap size={20} style={{ color: "black" }} />}
              title="Usage Alert"
            />
            <ActionRow
              description="Scheduled downtime at 2:00 AM UTC."
              icon={<Power size={20} style={{ color: "black" }} />}
              title="System Maintenance"
            />
          </Stack>
        </Drawer>
      </>
    );
  },
};

export const SolidVariant: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <Shield size={18} />
            Security Overview
          </Flex>
        </Button>
        <Drawer
          {...args}
          footer={
            <Button variant="outline" onClick={() => setOpen(false)}>
              Back to Dashboard
            </Button>
          }
          isOpen={open}
          title="System Integrity"
          variant="solid"
          onClose={() => setOpen(false)}
        >
          <Stack gap={6}>
            <Stack
              gap={1}
              style={{
                padding: "1rem",
                border: "2px solid currentColor",
                borderRadius: "4px",
              }}
            >
              <Text variant="h6" weight="bold">
                STATUS: PROTECTED
              </Text>
              <Text variant="small">
                All systems active. No threats detected.
              </Text>
            </Stack>

            <Stack gap={4}>
              <Text
                style={{ opacity: 0.8, textTransform: "uppercase" }}
                variant="small"
                weight="bold"
              >
                Network Health
              </Text>
              <ProgressBar color="var(--success)" height="12px" value={100} />
              <Text variant="small">
                Enterprise-grade encryption is active across all channels.
              </Text>
            </Stack>

            <Flex gap={4}>
              <Button variant="primary">Run Diagnostic</Button>
              <Button variant="ghost">View Action Logs</Button>
            </Flex>
          </Stack>
        </Drawer>
      </>
    );
  },
};

export const Composition: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <Settings2 size={18} />
            Custom Layout
          </Flex>
        </Button>
        <Drawer
          {...args}
          isOpen={open}
          side="right"
          onClose={() => setOpen(false)}
        >
          <Drawer.Header>
            <Flex align="center" gap={2}>
              <Shield size={20} />
              <Text variant="h4" weight="bold">
                Custom Header
              </Text>
            </Flex>
          </Drawer.Header>
          <Drawer.Body>
            <Stack gap={4}>
              <Text>
                This drawer uses the composition API with{" "}
                <code>Drawer.Header</code>, <code>Drawer.Body</code>, and{" "}
                <code>Drawer.Footer</code> for complete control.
              </Text>
              <ActionRow
                description="Full layout customization"
                icon={<Target size={20} />}
                title="Composition Pattern"
              />
            </Stack>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save Changes</Button>
          </Drawer.Footer>
        </Drawer>
      </>
    );
  },
};
