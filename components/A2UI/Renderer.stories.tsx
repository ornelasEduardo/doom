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
import { Renderer } from "./Renderer";
import type { A2UIComponentEntry } from "./types";

const meta: Meta<typeof Renderer> = {
  title: "Components/A2UI",
  component: Renderer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Renderer>;

// --- Interactive Playground ---

const defaultPlaygroundJson = `{
  "surfaceId": "playground",
  "components": [
    {
      "id": "root",
      "component": {
        "stack": {
          "gap": 6,
          "className": "p-8 w-full max-w-[1200px] mx-auto",
          "children": { "explicitList": ["header", "stats-grid", "main-content"] }
        }
      }
    },
    {
      "id": "header",
      "component": {
        "flex": {
          "justify": "space-between",
          "align": "center",
          "children": { "explicitList": ["title-block", "actions"] }
        }
      }
    },
    {
      "id": "title-block",
      "component": {
        "stack": {
          "gap": 1,
          "children": { "explicitList": ["title", "subtitle"] }
        }
      }
    },
    {
      "id": "title",
      "component": {
        "text": { "variant": "h2", "text": { "literalString": "Mission Control" } }
      }
    },
    {
      "id": "subtitle",
      "component": {
        "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Real-time telemetry and resource tracking" } }
      }
    },
    {
      "id": "actions",
      "component": {
        "flex": {
          "gap": 3,
          "children": { "explicitList": ["btn-refresh", "btn-settings"] }
        }
      }
    },
    {
      "id": "btn-refresh",
      "component": {
        "button": { "variant": "secondary", "size": "sm", "text": { "literalString": "Refresh Data" } }
      }
    },
    {
      "id": "btn-settings",
      "component": {
        "button": { "variant": "ghost", "size": "sm", "text": { "literalString": "Settings" } }
      }
    },
    {
      "id": "stats-grid",
      "component": {
        "grid": {
          "columns": 3,
          "gap": 4,
          "children": { "explicitList": ["stat-1", "stat-2", "stat-3"] }
        }
      }
    },
    {
      "id": "stat-1",
      "component": {
        "card": { "className": "p-6", "children": { "explicitList": ["lbl-1", "val-1", "badge-1"] } }
      }
    },
    {
      "id": "lbl-1",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Reactor Output" } } }
    },
    {
      "id": "val-1",
      "component": { "text": { "variant": "h3", "className": "mt-2 font-mono", "text": { "literalString": "98.4%" } } }
    },
    {
      "id": "badge-1",
      "component": { "badge": { "variant": "success", "className": "mt-2", "text": { "literalString": "Optimal" } } }
    },
    {
      "id": "stat-2",
      "component": {
        "card": { "className": "p-6", "children": { "explicitList": ["lbl-2", "val-2", "badge-2"] } }
      }
    },
    {
      "id": "lbl-2",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Oxygen Levels" } } }
    },
    {
      "id": "val-2",
      "component": { "text": { "variant": "h3", "className": "mt-2 font-mono", "text": { "literalString": "21.1%" } } }
    },
    {
      "id": "badge-2",
      "component": { "badge": { "variant": "secondary", "className": "mt-2", "text": { "literalString": "Stable" } } }
    },
    {
      "id": "stat-3",
      "component": {
        "card": { "className": "p-6", "children": { "explicitList": ["lbl-3", "val-3", "badge-3"] } }
      }
    },
    {
      "id": "lbl-3",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Crew Status" } } }
    },
    {
      "id": "val-3",
      "component": { "text": { "variant": "h3", "className": "mt-2 font-mono", "text": { "literalString": "4 / 12 Active" } } }
    },
    {
      "id": "badge-3",
      "component": { "badge": { "variant": "warning", "className": "mt-2", "text": { "literalString": "Shift Change" } } }
    },
    {
      "id": "main-content",
      "component": {
        "grid": {
          "columns": "2fr 1fr",
          "gap": 6,
          "children": { "explicitList": ["chart-section", "log-section"] }
        }
      }
    },
    {
      "id": "chart-section",
      "component": {
        "card": {
          "className": "p-6 h-full",
          "children": { "explicitList": ["chart-header-group", "main-chart", "chart-footer-stats"] }
        }
      }
    },
    {
      "id": "chart-header-group",
      "component": {
        "flex": {
          "justify": "space-between",
          "align": "flex-start",
          "className": "mb-6",
          "children": { "explicitList": ["chart-titles", "chart-actions"] }
        }
      }
    },
    {
      "id": "chart-titles",
      "component": {
        "stack": {
          "gap": 1,
          "children": { "explicitList": ["chart-custom-title", "chart-custom-subtitle"] }
        }
      }
    },
    {
      "id": "chart-custom-title",
      "component": { "text": { "variant": "h4", "text": { "literalString": "Power Consumption Trend" } } }
    },
    {
      "id": "chart-custom-subtitle",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Real-time usage across all sectors" } } }
    },
    {
      "id": "chart-actions",
      "component": {
        "select": {
          "defaultValue": "24h",
          "options": [
            { "label": "Last Hour", "value": "1h" },
            { "label": "Last 24 Hours", "value": "24h" },
            { "label": "Last 7 Days", "value": "7d" }
          ]
        }
      }
    },
    {
      "id": "main-chart",
      "component": {
        "chart": {
          "type": "area",
          "withLegend": true,
          "xKey": "time",
          "yKey": "value",
          "d3Config": {
            "grid": true,
            "withGradient": true,
            "showDots": true,
            "yAxisLabel": "Usage (GW)"
          },
          "style": { "height": 300 },
          "data": [
            { "time": "00:00", "value": 45 },
            { "time": "04:00", "value": 30 },
            { "time": "08:00", "value": 60 },
            { "time": "12:00", "value": 85 },
            { "time": "16:00", "value": 70 },
            { "time": "20:00", "value": 50 },
            { "time": "23:59", "value": 40 }
          ]
        }
      }
    },
    {
      "id": "chart-footer-stats",
      "component": {
        "grid": {
          "columns": 3,
          "gap": 4,
          "className": "mt-6 pt-6",
          "style": { "borderTop": "1px solid var(--border-color)" },
          "children": { "explicitList": ["stat-min", "stat-max", "stat-avg"] }
        }
      }
    },
    {
      "id": "stat-min",
      "component": { "stack": { "gap": 1, "children": { "explicitList": ["lbl-min", "val-min"] } } }
    },
    {
      "id": "lbl-min",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Minimum" } } }
    },
    {
      "id": "val-min",
      "component": { "text": { "variant": "body", "className": "font-mono font-bold", "text": { "literalString": "30 GW" } } }
    },
    {
      "id": "stat-max",
      "component": { "stack": { "gap": 1, "children": { "explicitList": ["lbl-max", "val-max"] } } }
    },
    {
      "id": "lbl-max",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Maximum" } } }
    },
    {
      "id": "val-max",
      "component": { "text": { "variant": "body", "className": "font-mono font-bold", "text": { "literalString": "85 GW" } } }
    },
    {
      "id": "stat-avg",
      "component": { "stack": { "gap": 1, "children": { "explicitList": ["lbl-avg", "val-avg"] } } }
    },
    {
      "id": "lbl-avg",
      "component": { "text": { "variant": "small", "className": "text-muted", "text": { "literalString": "Average" } } }
    },
    {
      "id": "val-avg",
      "component": { "text": { "variant": "body", "className": "font-mono font-bold", "text": { "literalString": "58.2 GW" } } }
    },
    {
      "id": "log-section",
      "component": {
        "card": {
          "className": "p-0 h-full overflow-hidden",
          "children": { "explicitList": ["log-table"] }
        }
      }
    },
    {
      "id": "log-table",
      "component": {
        "table": {
          "columns": ["Event", "Level", "Time"],
          "data": [
            { "Event": "System Boot", "Level": "Info", "Time": "08:00" },
            { "Event": "Surge Detected", "Level": "Warn", "Time": "10:15" },
            { "Event": "Cooling Active", "Level": "Info", "Time": "10:16" },
            { "Event": "Door Locked", "Level": "Info", "Time": "11:30" },
            { "Event": "Power Low", "Level": "Crit", "Time": "14:45" }
          ]
        }
      }
    }
  ]
}`;

const PlaygroundComponent = () => {
  const [jsonInput, setJsonInput] = useState(defaultPlaygroundJson);
  const [parsedData, setParsedData] = useState<{
    components: A2UIComponentEntry[];
    rootId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      // Handle both full surface format and just components array
      if (parsed.components) {
        setParsedData({
          components: parsed.components,
          rootId: parsed.components[0]?.id,
        });
      } else if (Array.isArray(parsed)) {
        setParsedData({
          components: parsed,
          rootId: parsed[0]?.id,
        });
      } else {
        throw new Error(
          "Invalid format: expected { components: [...] } or [...]",
        );
      }
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
          <Renderer
            rootId={parsedData.rootId}
            surface={parsedData.components}
          />
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
