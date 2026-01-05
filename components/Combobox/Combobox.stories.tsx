import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { Combobox } from "./Combobox";

const meta: Meta<typeof Combobox> = {
  title: "Components/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md"],
    },
    multiple: {
      control: "boolean",
    },
    searchable: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
];

const teamOptions = [
  { value: "avengers", label: "Avengers" },
  { value: "xmen", label: "X-Men" },
  { value: "guardians", label: "Guardians of the Galaxy" },
  { value: "defenders", label: "Defenders" },
  { value: "eternals", label: "Eternals" },
  { value: "inhumans", label: "Inhumans" },
];

// Wrapper for controlled state
function ComboboxDemo({
  multiple,
  ...props
}: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState<string | string[] | undefined>(
    multiple ? [] : undefined,
  );

  return (
    <div style={{ maxWidth: 280 }}>
      <Combobox
        {...props}
        multiple={multiple}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <ComboboxDemo {...args} />,
  args: {
    options: statusOptions,
    placeholder: "Select status...",
  },
};

export const MultiSelect: Story = {
  render: (args) => <ComboboxDemo {...args} />,
  args: {
    options: teamOptions,
    placeholder: "Select teams...",
    multiple: true,
  },
};

export const SmallSize: Story = {
  render: (args) => <ComboboxDemo {...args} />,
  args: {
    options: statusOptions,
    placeholder: "Select...",
    size: "sm",
  },
};

export const WithManyOptions: Story = {
  render: (args) => <ComboboxDemo {...args} />,
  args: {
    options: Array.from({ length: 20 }).map((_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    placeholder: "Select option...",
    multiple: true,
    searchable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "With many options, the search functionality makes it easy to find specific items.",
      },
    },
  },
};
