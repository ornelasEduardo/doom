import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sheet } from "./Sheet";
import { Button } from "../Button";

const meta: Meta<typeof Sheet> = {
  title: "Design System/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  argTypes: {
    isOpen: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Sheet</Button>
        <Sheet
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Transaction Details"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingBottom: "2rem",
            }}
          >
            <p className="text-muted-foreground">Review the details below.</p>
            <div
              style={{
                height: "50vh",
                background: "var(--muted)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Big Content Area (Charts, Logs, etc.)
            </div>
            <Button onClick={() => setOpen(false)} variant="primary">
              Confirm Action
            </Button>
            <Button onClick={() => setOpen(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </Sheet>
      </>
    );
  },
};
