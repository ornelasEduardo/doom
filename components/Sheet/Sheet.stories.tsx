import type { Meta, StoryObj } from "@storybook/react";
import { Activity, Command, SlidersHorizontal, Terminal } from "lucide-react";
import React, { useState } from "react";

import { Alert } from "../Alert/Alert";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Input } from "../Input/Input";
import { Flex, Stack } from "../Layout/Layout";
import { Table } from "../Table/Table";
import { Text } from "../Text/Text";
import { Sheet } from "./Sheet";

const meta: Meta<typeof Sheet> = {
  title: "Components/Sheet",
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
      <Text style={{ fontFamily: "var(--font-mono)" }} weight="bold">
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
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <Flex align="center" justify="center" style={{ height: "200px" }}>
        <Button onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <SlidersHorizontal size={18} />
            Open sheet
          </Flex>
        </Button>
        <Sheet
          {...args}
          footer={
            <Flex gap={4} style={{ width: "100%" }}>
              <Button
                style={{ width: "100%" }}
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Standby
              </Button>
              <Button
                style={{ width: "100%" }}
                variant="primary"
                onClick={() => setOpen(false)}
              >
                Synchronize
              </Button>
            </Flex>
          }
          isOpen={open}
          title="Tactical Operations Hub"
          onClose={() => setOpen(false)}
        >
          <Stack gap={8}>
            <Alert
              description="Biometric link established with Sector 7. Review real-time telemetry before core ignition."
              title="System Synchronized"
              variant="info"
            />

            <Stack gap={3}>
              <Flex align="center" gap={2}>
                <Activity size={16} />
                <Text
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  variant="small"
                  weight="black"
                >
                  Reactor Telemetry
                </Text>
              </Flex>
              <Table
                columns={telemetryColumns}
                data={telemetryData}
                enableFiltering={false}
                enablePagination={false}
              />
            </Stack>

            <Stack gap={4}>
              <Flex align="center" gap={2}>
                <Command size={16} />
                <Text
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  variant="small"
                  weight="black"
                >
                  Targeted Override
                </Text>
              </Flex>
              <Card style={{ padding: "var(--spacing-md)" }}>
                <Stack gap={4}>
                  <Stack gap={2}>
                    <Text color="muted" variant="small">
                      Encryption Sub-Key
                    </Text>
                    <Input
                      defaultValue="X77-RADIATION-VOID"
                      placeholder="Alpha-Numeric Sequence"
                    />
                  </Stack>
                  <Flex gap={2} wrap="wrap">
                    <Badge variant="secondary">Sector 01</Badge>
                    <Badge variant="secondary">Sector 02</Badge>
                    <Badge variant="primary">Ignition Zone</Badge>
                  </Flex>
                </Stack>
              </Card>
            </Stack>

            <Stack gap={3}>
              <Flex align="center" gap={2}>
                <Terminal size={16} />
                <Text
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  variant="small"
                  weight="black"
                >
                  Live System Logs
                </Text>
              </Flex>
              <Card
                style={{
                  background: "var(--on-surface)",
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
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <Flex align="center" justify="center" style={{ height: "200px" }}>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Flex align="center" gap={2}>
            <Activity size={18} />
            View Deployment Summary
          </Flex>
        </Button>
        <Sheet
          {...args}
          footer={
            <Stack gap={4} style={{ width: "100%" }}>
              <Button
                style={{ width: "100%" }}
                variant="primary"
                onClick={() => setOpen(false)}
              >
                Return to Dashboard
              </Button>
              <Button
                style={{ width: "100%" }}
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Download Manifest (JSON)
              </Button>
            </Stack>
          }
          isOpen={open}
          title="Deployment: Phase-IV Complete"
          variant="solid"
          onClose={() => setOpen(false)}
        >
          <Stack gap={10}>
            <Stack gap={4}>
              <Text
                style={{ textTransform: "uppercase", lineHeight: 1.1 }}
                variant="h3"
                weight="black"
              >
                Global Cluster Update Successful
              </Text>
              <Text style={{ opacity: 0.9 }} variant="body">
                Your updated build signature has been successfully propagated to
                all 12 edge nodes. Traffic is currently being routed through the
                primary gateway.
              </Text>
            </Stack>

            <Alert
              description="Checksum validation completed across all regional clusters with zero regressions."
              title="Integrity Verified"
              variant="success"
            />

            <Card
              style={{
                background: "rgba(0,0,0,0.1)",
                padding: "1.5rem",
              }}
            >
              <Stack gap={6}>
                <Stack gap={2}>
                  <Text
                    style={{
                      textTransform: "uppercase",
                      fontSize: "var(--text-xs)",
                    }}
                    weight="black"
                  >
                    Build Metadata & Source
                  </Text>
                  <Flex justify="space-between">
                    <Text variant="small">Commit Hash</Text>
                    <Text
                      style={{ fontFamily: "var(--font-mono)" }}
                      variant="small"
                      weight="bold"
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
                <Flex align="center" gap={2} wrap="wrap">
                  <Badge variant="secondary">us-east-1</Badge>
                  <Badge variant="secondary">eu-west-2</Badge>
                  <Badge variant="secondary">ap-south-1</Badge>
                </Flex>
              </Stack>
            </Card>

            <Stack gap={4}>
              <Text
                style={{ textTransform: "uppercase", opacity: 0.8 }}
                variant="small"
                weight="bold"
              >
                Regional Health Readout
              </Text>
              <Table
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
                enableFiltering={false}
                enablePagination={false}
              />
            </Stack>
          </Stack>
        </Sheet>
      </Flex>
    );
  },
};
