import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { neubrutalistTheme } from "../../styles/themes/presets";
import { defineTheme } from "../../styles/theming/defineTheme";
import { ThemeScope } from "../../styles/theming/ThemeScope";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Checkbox } from "../Checkbox/Checkbox";
import { Input } from "../Input/Input";
import { Select } from "../Select/Select";

// These themes intentionally do not extend a built-in preset.
const studioTheme = defineTheme({
  name: "Studio",
  foundations: {
    fonts: { body: "Georgia, serif", heading: "Georgia, serif" },
    radii: { control: "999px", surface: "24px" },
  },
  roles: {
    canvas: "#f5f1e9",
    surface: "#fffcf7",
    brand: "#345a47",
    onBrand: "#fff",
    foreground: "#26382e",
    border: "#b6c2b5",
  },
  components: {
    Card: {
      parts: {
        root: { padding: "28px", boxShadow: "0 12px 40px rgb(38 56 46 / 0.1)" },
      },
    },
    Button: { parts: { root: { fontStyle: "italic", paddingInline: "28px" } } },
  },
});
const terminalTheme = defineTheme({
  name: "Terminal",
  foundations: {
    fonts: { body: "monospace", heading: "monospace" },
    radii: { control: "0px", surface: "0px" },
    spacing: { "2": "6px", "4": "12px", "6": "18px" },
  },
  roles: {
    canvas: "#111b20",
    surface: "#17262d",
    foreground: "#e1f4eb",
    mutedForeground: "#b3c9bf",
    border: "#5a8072",
    brand: "#a8edc4",
    onBrand: "#11261b",
    input: "#111b20",
  },
  components: {
    Button: {
      parts: { root: { letterSpacing: "0.08em", textTransform: "uppercase" } },
    },
  },
});

function Controls() {
  const [selected, setSelected] = useState(false);
  return (
    <Card title="Project settings">
      <div style={{ display: "grid", gap: 16 }}>
        <Input defaultValue="An independent idea" label="Project name" />
        <Select
          label="Visibility"
          options={[
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]}
        />
        <Checkbox
          checked={selected}
          label="Enable notifications"
          onChange={(event) => setSelected(event.target.checked)}
        />
        <Button>Save changes</Button>
      </div>
    </Card>
  );
}
function ThemeGallery() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
      }}
    >
      {[neubrutalistTheme, studioTheme, terminalTheme].map((theme) => (
        <ThemeScope key={theme.name} withBackground theme={theme}>
          <div style={{ padding: 24 }}>
            <h2>{theme.name}</h2>
            <Controls />
          </div>
        </ThemeScope>
      ))}
    </div>
  );
}
const meta = {
  title: "Foundations/Independent themes",
  component: ThemeGallery,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ThemeGallery>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ThreeDesignLanguages: Story = {};
