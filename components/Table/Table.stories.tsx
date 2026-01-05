import type { Meta, StoryObj } from "@storybook/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import React from "react";

import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { Table } from "./Table";

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {
    density: {
      control: "radio",
      options: ["compact", "standard", "relaxed"],
    },
    variant: {
      control: "radio",
      options: ["default", "flat"],
    },
    striped: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// --- Data & Columns ---

type Hero = {
  id: string;
  alias: string;
  name: string;
  affiliation: string;
  status: "Active" | "MIA" | "Rogue" | "Retired";
  missionProgress: number;
  lastMission: string;
};

const columnHelper = createColumnHelper<Hero>();

const columns = [
  columnHelper.accessor("alias", {
    header: "Alias",
    cell: (info) => (
      <span style={{ fontWeight: 800, textTransform: "uppercase" }}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Secret Identity",
    cell: (info) => (
      <span style={{ fontFamily: "monospace" }}>{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("affiliation", {
    header: "Affiliation",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      let variant: "success" | "error" | "warning" | "secondary" = "secondary";

      if (status === "Active") {
        variant = "success";
      } else if (status === "Rogue") {
        variant = "error";
      } else if (status === "MIA") {
        variant = "warning";
      } else if (status === "Retired") {
        variant = "secondary";
      }

      return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
    },
  }),
  columnHelper.accessor("missionProgress", {
    header: "Mission Progress",
    cell: (info) => (
      <div
        style={{
          width: "140px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <ProgressBar
          color={
            info.getValue() > 90
              ? "var(--success)"
              : info.getValue() > 70
                ? "var(--warning)"
                : "var(--error)"
          }
          height={24}
          max={100}
          value={info.getValue()}
        />
        <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
          {info.getValue()}%
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("lastMission", {
    header: "Last Mission",
    cell: (info) => info.getValue(),
  }),
];

const heroData: Hero[] = [
  {
    id: "h1",
    alias: "Iron Man",
    name: "Tony Stark",
    affiliation: "Avengers",
    status: "Retired",
    missionProgress: 100,
    lastMission: "Endgame",
  },
  {
    id: "h2",
    alias: "Captain America",
    name: "Steve Rogers",
    affiliation: "Avengers",
    status: "Retired",
    missionProgress: 100,
    lastMission: "Endgame",
  },
  {
    id: "h3",
    alias: "Thor",
    name: "Thor Odinson",
    affiliation: "Asgardians",
    status: "Active",
    missionProgress: 88,
    lastMission: "Love and Thunder",
  },
  {
    id: "h4",
    alias: "Spider-Man",
    name: "Peter Parker",
    affiliation: "Avengers",
    status: "Active",
    missionProgress: 45,
    lastMission: "No Way Home",
  },
  {
    id: "h5",
    alias: "Black Widow",
    name: "Natasha Romanoff",
    affiliation: "Avengers",
    status: "MIA",
    missionProgress: 100,
    lastMission: "Endgame",
  },
  {
    id: "h6",
    alias: "Hulk",
    name: "Bruce Banner",
    affiliation: "Avengers",
    status: "Active",
    missionProgress: 98,
    lastMission: "She-Hulk",
  },
  {
    id: "h7",
    alias: "Doctor Strange",
    name: "Stephen Strange",
    affiliation: "Sorcerers",
    status: "Active",
    missionProgress: 15,
    lastMission: "Multiverse of Madness",
  },
  {
    id: "h8",
    alias: "Scarlet Witch",
    name: "Wanda Maximoff",
    affiliation: "None",
    status: "Rogue",
    missionProgress: 0,
    lastMission: "Multiverse of Madness",
  },
  {
    id: "h9",
    alias: "Black Panther",
    name: "T'Challa",
    affiliation: "Wakanda",
    status: "MIA",
    missionProgress: 100,
    lastMission: "Wakanda Forever",
  },
  {
    id: "h10",
    alias: "Star-Lord",
    name: "Peter Quill",
    affiliation: "Guardians",
    status: "Active",
    missionProgress: 60,
    lastMission: "Vol. 3",
  },
];

const generateLargeData = (count: number): Hero[] => {
  const aliases = [
    "Iron Man",
    "Thor",
    "Hulk",
    "Loki",
    "Thanos",
    "Venom",
    "Deadpool",
    "Cable",
    "Magneto",
    "Wolverine",
  ];
  const names = ["Unknown", "Classified", "Redacted"];
  const teams = [
    "Avengers",
    "X-Men",
    "Defenders",
    "Inhumans",
    "Eternals",
    "Guardians",
  ];
  const statuses = ["Active", "MIA", "Rogue", "Retired"] as const;

  return Array.from({ length: count }).map((_, i) => ({
    id: `hero-${i}`,
    alias: `${aliases[Math.floor(Math.random() * aliases.length)]} ${i + 1}`,
    name: names[Math.floor(Math.random() * names.length)],
    affiliation: teams[Math.floor(Math.random() * teams.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    missionProgress: Math.floor(Math.random() * 100),
    lastMission: `Mission #${1000 + i}`,
  }));
};

const largeData = generateLargeData(100);

// --- Stories ---

export const Default: Story = {
  args: {
    data: heroData.slice(0, 5),
    columns: columns as any,
    density: "standard",
  },
};

export const Striped: Story = {
  args: {
    data: heroData.slice(0, 5),
    columns: columns as any,
    striped: true,
  },
};

export const WithPagination: Story = {
  args: {
    data: largeData,
    columns: columns as any,
    enablePagination: true,
    pageSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Table with built-in pagination enabled. Shows 10 items per page by default.",
      },
    },
  },
};

export const WithToolbarActions: Story = {
  args: {
    data: heroData.slice(0, 5),
    columns: columns as any,
    enableFiltering: true,
    toolbarContent: (
      <>
        <Button variant="outline">
          <Download size={16} style={{ marginRight: "8px" }} />
          Export
        </Button>
        <Button>
          <Plus size={16} style={{ marginRight: "8px" }} />
          Add Hero
        </Button>
      </>
    ),
  },
};

export const Flat: Story = {
  args: {
    data: heroData.slice(0, 5),
    columns: columns as any,
    variant: "flat",
  },
  parameters: {
    docs: {
      description: {
        story:
          'A "Flat" variant that removes the outer card styling, useful for embedding in other containers.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    data: heroData.slice(0, 5),
    columns: columns as any,
    density: "compact",
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    columns: columns as any,
    enablePagination: false,
  },
};

export const VirtualizedUnbounded: Story = {
  args: {
    data: generateLargeData(1000),
    columns: columns as any,
    height: 400,
    enableVirtualization: true,
    enablePagination: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Virtualization enabled for large datasets (1000+ rows) with a fixed height.",
      },
    },
  },
};

export const Comprehensive: Story = {
  args: {
    data: generateLargeData(100),
    columns: columns.map((col) => ({
      ...col,
      filterFn: "arrIncludesSome",
    })) as any,
    enablePagination: true,
    enableFiltering: true,
    enableSorting: true,
    striped: true,
    pageSize: 10,
    toolbarContent: (
      <>
        <Button size="sm" variant="outline">
          <Download size={16} style={{ marginRight: "8px" }} />
          Export
        </Button>
        <Button size="sm">
          <Plus size={16} style={{ marginRight: "8px" }} />
          Add Hero
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "A comprehensive example showing all major features enabled: Pagination, Sorting, Global Search, Column Header Filters, Toolbar Actions, and Striped rows.",
      },
    },
  },
};

export const WithAdvancedFiltering: Story = {
  args: {
    data: generateLargeData(50),
    columns: columns as any,
    enableAdvancedFiltering: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
    filters: [
      {
        columnId: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "MIA", label: "MIA" },
          { value: "Rogue", label: "Rogue" },
          { value: "Retired", label: "Retired" },
        ],
      },
      {
        columnId: "affiliation",
        label: "Affiliation",
        type: "select",
        options: [
          { value: "Avengers", label: "Avengers" },
          { value: "X-Men", label: "X-Men" },
          { value: "Defenders", label: "Defenders" },
          { value: "Inhumans", label: "Inhumans" },
          { value: "Eternals", label: "Eternals" },
          { value: "Guardians", label: "Guardians" },
        ],
      },
      {
        columnId: "alias",
        label: "Alias",
        type: "text",
        operators: ["contains", "eq", "neq", "startsWith"],
      },
      {
        columnId: "name",
        label: "Secret Identity",
        type: "text",
        operators: ["contains", "eq", "neq"],
      },
      {
        columnId: "missionProgress",
        label: "Mission Progress",
        type: "number",
        operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
      },
      {
        columnId: "lastMission",
        label: "Last Mission",
        type: "text",
        operators: ["contains", "eq", "startsWith"],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Advanced Filter Builder playground. Click the filter icon to open the nested filter sheet. Build complex filters with AND/OR logic, multiple conditions, and nested groups. Try filtering by status='Active', or combining conditions like 'affiliation=Avengers AND missionProgress > 50'.",
      },
    },
  },
};
