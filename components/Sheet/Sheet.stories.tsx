import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sheet } from "./Sheet";
import { Button } from "../Button/Button";
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";
import { Badge } from "../Badge/Badge";
import { Card } from "../Card/Card";
import { Table } from "../Table/Table";
import { Alert } from "../Alert/Alert";
import {
  Activity,
  Command,
  ShieldAlert,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";

const meta: Meta<typeof Sheet> = {
  title: "Design System/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  argTypes: {
    isOpen: { control: "boolean" },
    variant: {
      control: "select",
      options: ["default", "solid"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

// --- Mock Data for High-Quality Showcase ---
const telemetryData = [
  {
    id: "1",
    sensor: "Reactor Core 01",
    status: "STABLE",
    value: "84.2°C",
    load: 74,
  },
  {
    id: "2",
    sensor: "Shield Gen-A",
    status: "ACTIVE",
    value: "98.4%",
    load: 12,
  },
  { id: "3", sensor: "Oxygen Mix", status: "WARN", value: "18.2%", load: 88 },
];

const telemetryColumns = [
  { header: "Sensor Node", accessorKey: "sensor" },
  {
    header: "Telemetry",
    accessorKey: "value",
    cell: ({ row }: any) => (
      <Text weight="bold" style={{ fontFamily: "var(--font-mono)" }}>
        {row.original.value}
      </Text>
    ),
  },
  {
    header: "Alert Level",
    accessorKey: "status",
    cell: ({ row }: any) => (
      <Badge variant={row.original.status === "WARN" ? "warning" : "success"}>
        {row.original.status}
      </Badge>
    ),
  },
];

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Flex justify="center" align="center" style={{ height: "200px" }}>
        <Button onClick={() => setOpen(true)}>
          <Flex align="center" gap="0.5rem">
            <SlidersHorizontal size={18} />
            Open sheet
          </Flex>
        </Button>
        <Sheet
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Tactical Operations Hub"
          footer={
            <Flex gap="1rem" style={{ width: "100%" }}>
              <Button
                variant="ghost"
                style={{ width: "100%" }}
                onClick={() => setOpen(false)}
              >
                Standby
              </Button>
              <Button
                variant="primary"
                style={{ width: "100%" }}
                onClick={() => setOpen(false)}
              >
                Synchronize
              </Button>
            </Flex>
          }
        >
          <Stack gap="2rem">
            <Alert
              variant="info"
              title="System Synchronized"
              description="Biometric link established with Sector 7. Review real-time telemetry before core ignition."
            />

            <Stack gap="0.75rem">
              <Flex align="center" gap="0.5rem">
                <Activity size={16} />
                <Text
                  variant="small"
                  weight="black"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Reactor Telemetry
                </Text>
              </Flex>
              <Table
                data={telemetryData}
                columns={telemetryColumns}
                enablePagination={false}
                enableFiltering={false}
              />
            </Stack>

            <Stack gap="1rem">
              <Flex align="center" gap="0.5rem">
                <Command size={16} />
                <Text
                  variant="small"
                  weight="black"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Targeted Override
                </Text>
              </Flex>
              <Card style={{ padding: "var(--spacing-md)" }}>
                <Stack gap="1rem">
                  <Stack gap="0.5rem">
                    <Text variant="small" color="muted">
                      Encryption Sub-Key
                    </Text>
                    <Input
                      placeholder="Alpha-Numeric Sequence"
                      defaultValue="X77-RADIATION-VOID"
                    />
                  </Stack>
                  <Flex gap="0.5rem" wrap="wrap">
                    <Badge variant="secondary">Sector 01</Badge>
                    <Badge variant="secondary">Sector 02</Badge>
                    <Badge variant="primary">Ignition Zone</Badge>
                  </Flex>
                </Stack>
              </Card>
            </Stack>

            <Stack gap="0.75rem">
              <Flex align="center" gap="0.5rem">
                <Terminal size={16} />
                <Text
                  variant="small"
                  weight="black"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Live System Logs
                </Text>
              </Flex>
              <Card
                style={{
                  background: "var(--foreground)",
                  color: "var(--background)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  padding: "1rem",
                  border: "var(--border-width) solid var(--border-strong)",
                }}
              >
                <div style={{ opacity: 0.7 }}>
                  [14:02:01] BIOSIGNAL DETECTED: AGENT_77
                </div>
                <div style={{ opacity: 0.7 }}>
                  [14:02:05] COOLANT PRESSURE: NOMINAL
                </div>
                <div style={{ opacity: 1, fontWeight: "bold" }}>
                  [14:02:10] HANDSHAKE SUCCESSFUL
                </div>
              </Card>
            </Stack>
          </Stack>
        </Sheet>
      </Flex>
    );
  },
};

export const Solid: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Flex justify="center" align="center" style={{ height: "200px" }}>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap="0.5rem">
            <Activity size={18} />
            View Deployment Summary
          </Flex>
        </Button>
        <Sheet
          {...args}
          isOpen={open}
          variant="solid"
          onClose={() => setOpen(false)}
          title="Deployment: Phase-IV Complete"
          footer={
            <Stack gap="1rem" style={{ width: "100%" }}>
              <Button
                variant="primary"
                style={{ width: "100%" }}
                onClick={() => setOpen(false)}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="ghost"
                style={{ width: "100%" }}
                onClick={() => setOpen(false)}
              >
                Download Manifest (JSON)
              </Button>
            </Stack>
          }
        >
          <Stack gap="2.5rem">
            <Stack gap="1rem">
              <Text
                variant="h3"
                weight="black"
                style={{ textTransform: "uppercase", lineHeight: 1.1 }}
              >
                Global Cluster Update Successful
              </Text>
              <Text variant="body" style={{ opacity: 0.9 }}>
                Your updated build signature has been successfully propagated to
                all 12 edge nodes. Traffic is currently being routed through the
                primary gateway.
              </Text>
            </Stack>

            <Alert
              variant="success"
              title="Integrity Verified"
              description="Checksum validation completed across all regional clusters with zero regressions."
            />

            <Card
              style={{
                background: "rgba(0,0,0,0.1)",
                padding: "1.5rem",
              }}
            >
              <Stack gap="1.5rem">
                <Stack gap="0.5rem">
                  <Text
                    weight="black"
                    style={{
                      textTransform: "uppercase",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    Build Metadata & Source
                  </Text>
                  <Flex justify="space-between">
                    <Text variant="small">Commit Hash</Text>
                    <Text
                      variant="small"
                      weight="bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      b7f2a8c
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text variant="small">Build Duration</Text>
                    <Text variant="small" weight="bold">
                      2m 43s
                    </Text>
                  </Flex>
                </Stack>
                <Flex align="center" gap="0.5rem" wrap="wrap">
                  <Badge variant="secondary">us-east-1</Badge>
                  <Badge variant="secondary">eu-west-2</Badge>
                  <Badge variant="secondary">ap-south-1</Badge>
                </Flex>
              </Stack>
            </Card>

            <Stack gap="1rem">
              <Text
                variant="small"
                weight="bold"
                style={{ textTransform: "uppercase", opacity: 0.8 }}
              >
                Regional Health Readout
              </Text>
              <Table
                data={[
                  {
                    region: "North America",
                    status: "STABLE",
                    latency: "12ms",
                  },
                  {
                    region: "European Union",
                    status: "STABLE",
                    latency: "45ms",
                  },
                  {
                    region: "Asia Pacific",
                    status: "SYNCING",
                    latency: "120ms",
                  },
                ]}
                columns={[
                  { header: "Cloud Region", accessorKey: "region" },
                  {
                    header: "Status",
                    accessorKey: "status",
                    cell: ({ row }: any) => (
                      <Badge
                        variant={
                          row.original.status === "SYNCING"
                            ? "warning"
                            : "success"
                        }
                      >
                        {row.original.status}
                      </Badge>
                    ),
                  },
                  { header: "Latency", accessorKey: "latency" },
                ]}
                enablePagination={false}
                enableFiltering={false}
              />
            </Stack>
          </Stack>
        </Sheet>
      </Flex>
    );
  },
};
