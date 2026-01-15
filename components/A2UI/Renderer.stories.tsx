import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { Alert } from "../Alert/Alert";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { CopyButton } from "../CopyButton/CopyButton";
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Textarea } from "../Textarea/Textarea";
import { getA2UISystemPrompt } from "./promptUtils";
import { A2UINode, Renderer } from "./Renderer";

const meta: Meta<typeof Renderer> = {
  title: "Components/A2UI",
  component: Renderer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Renderer>;

// --- Executive Dashboard Example ---

const executiveDashboardData = {
  type: "flex",
  props: {
    className: "p-8 w-full h-full",
    style: { background: "var(--background)" },
    direction: "column",
    gap: 6,
  },
  children: [
    // Header
    {
      type: "flex",
      props: { justify: "space-between", align: "center", className: "w-full" },
      children: [
        {
          type: "text",
          props: {
            variant: "h2",
            className: "font-bold",
            style: { color: "var(--foreground)" },
          },
          children: ["Mars Facility Analytics"],
        },
        {
          type: "flex",
          props: { gap: 4, align: "center" },
          children: [
            {
              type: "badge",
              props: { variant: "success", size: "md" },
              children: ["System Online"],
            },
            {
              type: "avatar",
              props: {
                fallback: "DS",
                size: "md",
                style: { background: "var(--primary)" },
              },
            },
          ],
        },
      ],
    },

    // Stats Row
    {
      type: "grid",
      props: { columns: 3, gap: 6, className: "w-full" },
      children: [
        {
          type: "card",
          props: { className: "p-6" },
          children: [
            {
              type: "text",
              props: { variant: "small", className: "text-muted" },
              children: ["Total Energy Output"],
            },
            {
              type: "text",
              props: {
                variant: "h3",
                className: "mt-2",
                style: { fontFamily: "monospace" },
              },
              children: ["45.2 GW"],
            },
            {
              type: "badge",
              props: { variant: "success", size: "sm", className: "mt-2" },
              children: ["+12% vs last cycle"],
            },
          ],
        },
        {
          type: "card",
          props: { className: "p-6" },
          children: [
            {
              type: "text",
              props: { variant: "small", className: "text-muted" },
              children: ["Active Personnel"],
            },
            {
              type: "text",
              props: { variant: "h3", className: "mt-2 font-mono" },
              children: ["8,421"],
            },
            {
              type: "badge",
              props: { variant: "secondary", size: "sm", className: "mt-2" },
              children: ["Stable"],
            },
          ],
        },
        {
          type: "card",
          props: { className: "p-6" },
          children: [
            {
              type: "text",
              props: { variant: "small", className: "text-muted" },
              children: ["Threat Level"],
            },
            {
              type: "text",
              props: {
                variant: "h3",
                className: "mt-2 text-error",
                style: { fontFamily: "monospace" },
              },
              children: ["CRITICAL"],
            },
            {
              type: "badge",
              props: { variant: "error", size: "sm", className: "mt-2" },
              children: ["Containment Breach"],
            },
          ],
        },
      ],
    },

    // Main Content: Tabs
    {
      type: "tabs",
      props: { defaultValue: "overview", className: "w-full" },
      children: [
        {
          type: "tabs-list",
          children: [
            {
              type: "tabs-trigger",
              props: { value: "overview" },
              children: ["Overview"],
            },
            {
              type: "tabs-trigger",
              props: { value: "incidents" },
              children: ["Incidents"],
            },
            {
              type: "tabs-trigger",
              props: { value: "personnel" },
              children: ["Personnel"],
            },
          ],
        },
        {
          type: "tabs-body",
          children: [
            {
              type: "tabs-content",
              props: { value: "overview" },
              children: [
                // Alert
                {
                  type: "alert",
                  props: {
                    variant: "error",
                    title: "Critical System Failure",
                    description:
                      "Sector 7G containment breach detected. Evacuation protocols initiated.",
                    className: "mb-6",
                  },
                },
                // Grid with Chart and Alerts
                {
                  type: "grid",
                  props: { columns: "2fr 1fr", gap: 6 },
                  children: [
                    // Chart
                    {
                      type: "chart",
                      props: {
                        title: "Power Consumption",
                        subtitle: "Last 24 Hours",
                        type: "area",
                        withLegend: true,
                        xKey: "time",
                        yKey: "value",
                        config: {
                          value: {
                            label: "Usage (GW)",
                            color: "var(--primary)",
                          },
                        },
                        data: [
                          { time: "00:00", value: 30 },
                          { time: "04:00", value: 45 },
                          { time: "08:00", value: 25 },
                          { time: "12:00", value: 60 },
                          { time: "16:00", value: 55 },
                          { time: "20:00", value: 40 },
                          { time: "23:59", value: 35 },
                        ],
                        style: { height: 400 },
                        d3Config: {
                          grid: true,
                          withGradient: true,
                          showDots: true,
                        },
                      },
                    },
                    // Recent Alerts
                    {
                      type: "card",
                      props: {
                        className:
                          "overflow-hidden flex flex-col align-start gap-4",
                      },
                      children: [
                        {
                          type: "text",
                          props: { variant: "h4" },
                          children: ["Recent Alerts"],
                        },
                        {
                          type: "stack",
                          props: { className: "flex-1 overflow-y-auto" },
                          children: [
                            {
                              type: "slat",
                              props: {
                                label: "Sector 7G Power Surge",
                                secondaryLabel: "2 mins ago",
                                variant: "danger",
                              },
                            },
                            {
                              type: "slat",
                              props: {
                                label: "Airlock 4 Pressure Drop",
                                secondaryLabel: "15 mins ago",
                                variant: "warning",
                              },
                            },
                            {
                              type: "slat",
                              props: {
                                label: "Routine Maintenance",
                                secondaryLabel: "1 hour ago",
                                variant: "default",
                              },
                            },
                            {
                              type: "slat",
                              props: {
                                label: "Shift Change",
                                secondaryLabel: "4 hours ago",
                                variant: "default",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const ExecutiveDashboard: Story = {
  args: {
    data: executiveDashboardData,
  },
};

// --- User Profile Example ---

const userProfileData = {
  type: "flex",
  props: {
    className: "p-8 w-full min-h-screen",
    style: { background: "var(--background)" },
    direction: "column",
    gap: 6,
  },
  children: [
    // Breadcrumbs
    {
      type: "breadcrumbs",
      children: [
        { type: "breadcrumb-item", props: { href: "/" }, children: ["Home"] },
        {
          type: "breadcrumb-item",
          props: { href: "/users" },
          children: ["Users"],
        },
        { type: "breadcrumb-item", children: ["Dr. Sarah Chen"] },
      ],
    },

    // Profile Header
    {
      type: "card",
      props: { className: "p-6" },
      children: [
        {
          type: "flex",
          props: { gap: 6, align: "flex-start", justify: "space-between" },
          children: [
            // Left side: Avatar + Info
            {
              type: "flex",
              props: { gap: 4, align: "flex-start" },
              children: [
                {
                  type: "avatar",
                  props: {
                    fallback: "SC",
                    size: "xl",
                  },
                },
                {
                  type: "stack",
                  props: { gap: 2 },
                  children: [
                    {
                      type: "flex",
                      props: { align: "center", gap: 3 },
                      children: [
                        {
                          type: "text",
                          props: { variant: "h2" },
                          children: ["Dr. Sarah Chen"],
                        },
                        {
                          type: "badge",
                          props: { variant: "success" },
                          children: ["Active"],
                        },
                        {
                          type: "chip",
                          props: { variant: "primary" },
                          children: ["Level 5 Access"],
                        },
                      ],
                    },
                    {
                      type: "text",
                      props: {
                        variant: "small",
                        className: "text-muted",
                      },
                      children: ["Chief Science Officer • Research Division"],
                    },
                    {
                      type: "flex",
                      props: { gap: 2, className: "mt-1" },
                      children: [
                        { type: "chip", children: ["Exobiology"] },
                        { type: "chip", children: ["Xenolinguistics"] },
                        { type: "chip", children: ["Containment"] },
                      ],
                    },
                  ],
                },
              ],
            },
            // Right side: Action buttons
            {
              type: "flex",
              props: { gap: 3 },
              children: [
                {
                  type: "button",
                  props: { variant: "secondary" },
                  children: ["Edit Profile"],
                },
                {
                  type: "button",
                  props: { variant: "primary" },
                  children: ["Send Message"],
                },
              ],
            },
          ],
        },
      ],
    },

    // Main Content Grid
    {
      type: "grid",
      props: { columns: "1fr 2fr", gap: 6 },
      children: [
        // Left Column - Quick Stats
        {
          type: "stack",
          props: { gap: 4 },
          children: [
            // Training Progress Card
            {
              type: "card",
              props: { className: "p-6" },
              children: [
                {
                  type: "text",
                  props: { variant: "h4", className: "mb-4" },
                  children: ["Training Progress"],
                },
                {
                  type: "stack",
                  props: { gap: 4 },
                  children: [
                    {
                      type: "stack",
                      props: { gap: 1 },
                      children: [
                        {
                          type: "flex",
                          props: { justify: "space-between" },
                          children: [
                            {
                              type: "text",
                              props: { variant: "small" },
                              children: ["Safety Protocols"],
                            },
                            {
                              type: "text",
                              props: {
                                variant: "small",
                                className: "text-muted",
                              },
                              children: ["100%"],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          props: { value: 100, variant: "success" },
                        },
                      ],
                    },
                    {
                      type: "stack",
                      props: { gap: 1 },
                      children: [
                        {
                          type: "flex",
                          props: { justify: "space-between" },
                          children: [
                            {
                              type: "text",
                              props: { variant: "small" },
                              children: ["Containment Procedures"],
                            },
                            {
                              type: "text",
                              props: {
                                variant: "small",
                                className: "text-muted",
                              },
                              children: ["87%"],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          props: { value: 87, variant: "primary" },
                        },
                      ],
                    },
                    {
                      type: "stack",
                      props: { gap: 1 },
                      children: [
                        {
                          type: "flex",
                          props: { justify: "space-between" },
                          children: [
                            {
                              type: "text",
                              props: { variant: "small" },
                              children: ["Emergency Response"],
                            },
                            {
                              type: "text",
                              props: {
                                variant: "small",
                                className: "text-muted",
                              },
                              children: ["45%"],
                            },
                          ],
                        },
                        {
                          type: "progress-bar",
                          props: { value: 45, variant: "warning" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // Contact Card
            {
              type: "card",
              props: { className: "p-6" },
              children: [
                {
                  type: "text",
                  props: { variant: "h4", className: "mb-4" },
                  children: ["Contact Information"],
                },
                {
                  type: "stack",
                  props: { gap: 3 },
                  children: [
                    {
                      type: "input",
                      props: {
                        label: "Email",
                        value: "s.chen@mars-facility.gov",
                        disabled: true,
                      },
                    },
                    {
                      type: "input",
                      props: {
                        label: "Terminal ID",
                        value: "TERM-7G-042",
                        disabled: true,
                      },
                    },
                    {
                      type: "input",
                      props: {
                        label: "Emergency Contact",
                        value: "+1 (555) 123-4567",
                        disabled: true,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // Right Column - Activity & Details
        {
          type: "card",
          props: { className: "p-6" },
          children: [
            {
              type: "text",
              props: { variant: "h4", className: "mb-4" },
              children: ["Personnel Record"],
            },
            {
              type: "accordion",
              props: { type: "multiple", defaultValue: ["clearance"] },
              children: [
                {
                  type: "accordion-item",
                  props: { value: "clearance", trigger: "Security Clearance" },
                  children: [
                    {
                      type: "stack",
                      props: { gap: 3 },
                      children: [
                        {
                          type: "slat",
                          props: {
                            label: "Level 5 - Full Access",
                            secondaryLabel: "Granted: 2024-01-15",
                            variant: "success",
                          },
                        },
                        {
                          type: "slat",
                          props: {
                            label: "Sector 7G Override",
                            secondaryLabel: "Temporary",
                            variant: "warning",
                          },
                        },
                        {
                          type: "slat",
                          props: {
                            label: "Classified Archives",
                            secondaryLabel: "Read Only",
                            variant: "default",
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "accordion-item",
                  props: { value: "history", trigger: "Employment History" },
                  children: [
                    {
                      type: "stack",
                      props: { gap: 3 },
                      children: [
                        {
                          type: "slat",
                          props: {
                            label: "Chief Science Officer",
                            secondaryLabel: "2023 - Present",
                          },
                        },
                        {
                          type: "slat",
                          props: {
                            label: "Senior Researcher",
                            secondaryLabel: "2020 - 2023",
                          },
                        },
                        {
                          type: "slat",
                          props: {
                            label: "Research Associate",
                            secondaryLabel: "2018 - 2020",
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "accordion-item",
                  props: { value: "incidents", trigger: "Incident Reports" },
                  children: [
                    {
                      type: "alert",
                      props: {
                        variant: "warning",
                        title: "Pending Review",
                        description:
                          "Incident #7G-2024-001 is under investigation.",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const UserProfile: Story = {
  args: {
    data: userProfileData,
  },
};

// --- Interactive Playground ---

const defaultPlaygroundJson = `{
  "type": "card",
  "props": { "className": "p-6" },
  "children": [
    {
      "type": "stack",
      "props": { "gap": 4 },
      "children": [
        { "type": "text", "props": { "variant": "h2" }, "children": ["Hello A2UI!"] },
        { "type": "text", "props": { "variant": "body" }, "children": ["Paste your JSON here and click Render."] },
        { "type": "badge", "props": { "variant": "success" }, "children": ["Working"] }
      ]
    }
  ]
}`;

const PlaygroundComponent = () => {
  const [jsonInput, setJsonInput] = useState(defaultPlaygroundJson);
  const [parsedData, setParsedData] = useState<A2UINode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedData(parsed);
      setError(null);
      setIsRendered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleReset = () => {
    setIsRendered(false);
    setParsedData(null);
  };

  // Rendered view with floating Redo button
  if (isRendered && parsedData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Button
          style={{
            position: "sticky",
            top: 16,
            alignSelf: "flex-end",
            marginRight: 16,
            zIndex: 100,
          }}
          variant="secondary"
          onClick={handleReset}
        >
          ← Edit JSON
        </Button>
        <div style={{ padding: 24 }}>
          <Renderer data={parsedData} />
        </div>
      </div>
    );
  }

  // Form view
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 700, padding: 32 }}>
        <form onSubmit={handleSubmit}>
          <Stack gap={5}>
            <Flex align="center" justify="space-between">
              <Text variant="h2">A2UI Playground</Text>
              <CopyButton
                size="sm"
                value={getA2UISystemPrompt()}
                variant="ghost"
              >
                Copy Prompt
              </CopyButton>
            </Flex>
            <Text color="muted">
              Paste your A2UI JSON below and click Render to see it in action.
            </Text>

            {error && (
              <Alert description={error} title="Parse Error" variant="error" />
            )}

            <Textarea
              label="A2UI JSON"
              rows={20}
              style={{ fontFamily: "monospace", fontSize: 13 }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />

            <Flex gap={3} justify="flex-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setJsonInput(defaultPlaygroundJson)}
              >
                Reset
              </Button>
              <Button type="submit" variant="primary">
                Render
              </Button>
            </Flex>
          </Stack>
        </form>
      </Card>
    </Flex>
  );
};

export const Playground: Story = {
  render: () => <PlaygroundComponent />,
  parameters: {
    layout: "fullscreen",
  },
};
