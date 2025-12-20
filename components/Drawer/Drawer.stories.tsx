import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Drawer } from "./Drawer";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Stack, Flex } from "../Layout/Layout";
import { Avatar } from "../Avatar/Avatar";
import { Badge } from "../Badge/Badge";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Switch } from "../Switch/Switch";
import { Slider } from "../Slider/Slider";
import { Select } from "../Select/Select";
import { ActionRow } from "../ActionRow/ActionRow";
import {
  User,
  Bell,
  Shield,
  Settings2,
  Power,
  Zap,
  Target,
  History,
} from "lucide-react";

const meta: Meta<typeof Drawer> = {
  title: "Design System/Drawer",
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
        <Button onClick={() => setOpen(true)} variant="primary">
          <Flex align="center" gap="0.5rem">
            <User size={18} />
            View Account
          </Flex>
        </Button>
        <Drawer
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Account Profile"
          footer={
            <Button
              variant="outline"
              style={{ width: "100%" }}
              onClick={() => setOpen(false)}
            >
              Sign Out
            </Button>
          }
        >
          <Stack gap="2rem">
            <Flex direction="column" align="center" gap="1rem">
              <Avatar fallback="PP" size="xl" shape="circle" />
              <Stack gap="0.25rem" style={{ textAlign: "center" }}>
                <Text variant="h4" weight="bold">
                  Peter Parker
                </Text>
                <Text color="muted">Lead Technical Researcher</Text>
              </Stack>
              <Flex gap="0.5rem">
                <Badge variant="success">Active</Badge>
                <Badge variant="primary">Pro Plan</Badge>
              </Flex>
            </Flex>

            <Stack gap="1rem">
              <Text
                variant="small"
                weight="bold"
                color="muted"
                style={{ textTransform: "uppercase" }}
              >
                Performance Metrics
              </Text>
              <Stack gap="0.5rem">
                <Flex justify="space-between">
                  <Text variant="small">Project Completion</Text>
                  <Text variant="small" weight="bold">
                    92%
                  </Text>
                </Flex>
                <ProgressBar value={92} height="12px" color="var(--primary)" />
              </Stack>
              <Stack gap="0.5rem">
                <Flex justify="space-between">
                  <Text variant="small">Code Quality Score</Text>
                  <Text variant="small" weight="bold">
                    98%
                  </Text>
                </Flex>
                <ProgressBar
                  value={98}
                  height="12px"
                  color="var(--secondary)"
                />
              </Stack>
            </Stack>

            <Stack gap="0.75rem">
              <Text
                variant="small"
                weight="bold"
                color="muted"
                style={{ textTransform: "uppercase" }}
              >
                Recent Contributions
              </Text>
              <ActionRow
                icon={<Target size={20} />}
                title="Design System"
                description="Merged 12 components into main branch."
              />
              <ActionRow
                icon={<Zap size={20} />}
                title="Performance Optimization"
                description="Reduced bundle size by 15%."
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
        <Button onClick={() => setOpen(true)} variant="primary">
          <Flex align="center" gap="0.5rem">
            <Settings2 size={18} />
            User Settings
          </Flex>
        </Button>
        <Drawer
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Settings"
        >
          <Stack gap="1.5rem">
            <Stack gap="1rem">
              <Text
                variant="small"
                weight="bold"
                color="muted"
                style={{ textTransform: "uppercase" }}
              >
                Regional
              </Text>
              <Select
                options={[
                  { label: "English (US)", value: "en-us" },
                  { label: "Spanish (ES)", value: "es" },
                  { label: "French (FR)", value: "fr" },
                ]}
                defaultValue="en-us"
                label="Language"
              />
              <Slider label="Interface Scale" defaultValue={100} />
            </Stack>

            <Stack gap="1rem">
              <Text
                variant="small"
                weight="bold"
                color="muted"
                style={{ textTransform: "uppercase" }}
              >
                Preferences
              </Text>
              <Flex align="center" justify="space-between">
                <Stack gap="0">
                  <Text weight="medium">Push Notifications</Text>
                  <Text variant="small" color="muted">
                    Receive desktop alerts
                  </Text>
                </Stack>
                <Switch
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                />
              </Flex>
              <Flex align="center" justify="space-between">
                <Stack gap="0">
                  <Text weight="medium">Dark Mode</Text>
                  <Text variant="small" color="muted">
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
        <Button onClick={() => setOpen(true)} variant="primary">
          <Flex align="center" gap="0.5rem">
            <Bell size={18} />
            Notifications
          </Flex>
        </Button>
        <Drawer
          {...args}
          side="left"
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Activity Feed"
        >
          <Stack gap="1rem" style={{ margin: "-1rem" }}>
            <ActionRow
              icon={<Shield size={20} style={{ color: "black" }} />}
              title="Identity Verified"
              description="Your account was successfully verified."
            />
            <ActionRow
              icon={<History size={20} style={{ color: "black" }} />}
              title="Security Backup"
              description="Last cloud sync 5 minutes ago."
            />
            <ActionRow
              icon={<Zap size={20} style={{ color: "black" }} />}
              title="Usage Alert"
              description="You have reached 80% of your api limit."
            />
            <ActionRow
              icon={<Power size={20} style={{ color: "black" }} />}
              title="System Maintenance"
              description="Scheduled downtime at 2:00 AM UTC."
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
        <Button onClick={() => setOpen(true)} variant="primary">
          <Flex align="center" gap="0.5rem">
            <Shield size={18} />
            Security Overview
          </Flex>
        </Button>
        <Drawer
          {...args}
          variant="solid"
          isOpen={open}
          onClose={() => setOpen(false)}
          title="System Integrity"
          footer={
            <Button variant="outline" onClick={() => setOpen(false)}>
              Back to Dashboard
            </Button>
          }
        >
          <Stack gap="1.5rem">
            <Stack
              gap="0.25rem"
              style={{
                padding: "1rem",
                border: "2px solid currentColor",
                borderRadius: "4px",
              }}
            >
              <Text weight="bold" variant="h6">
                STATUS: PROTECTED
              </Text>
              <Text variant="small">
                All systems active. No threats detected.
              </Text>
            </Stack>

            <Stack gap="1rem">
              <Text
                variant="small"
                weight="bold"
                style={{ opacity: 0.8, textTransform: "uppercase" }}
              >
                Network Health
              </Text>
              <ProgressBar value={100} color="var(--success)" height="12px" />
              <Text variant="small">
                Enterprise-grade encryption is active across all channels.
              </Text>
            </Stack>

            <Flex gap="1rem">
              <Button variant="primary">Run Diagnostic</Button>
              <Button variant="ghost">View Action Logs</Button>
            </Flex>
          </Stack>
        </Drawer>
      </>
    );
  },
};
