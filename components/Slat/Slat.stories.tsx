import type { Meta, StoryObj } from "@storybook/react";
import { AlertTriangle, Check, File, X } from "lucide-react";

import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Slat } from "./Slat";

const meta: Meta<typeof Slat> = {
  title: "Components/Slat",
  component: Slat,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Slat>;

export const Default: Story = {
  args: {
    label: "report-2024.pdf",
    secondaryLabel: "2.5 MB",
    prependContent: <File size={20} />,
    appendContent: <X size={20} style={{ cursor: "pointer" }} />,
    style: { width: "400px" },
  },
};

export const WithBadge: Story = {
  args: {
    label: "Important Document",
    secondaryLabel: "Last edited 2 mins ago",
    prependContent: <File size={20} />,
    appendContent: <Badge variant="success">Verified</Badge>,
    style: { width: "400px" },
  },
};

export const DangerVariant: Story = {
  args: {
    label: "Virus.exe",
    secondaryLabel: "Detected threat",
    variant: "danger",
    prependContent: <AlertTriangle size={20} />,
    style: { width: "400px" },
  },
};

export const SuccessVariant: Story = {
  args: {
    label: "Deployment Script",
    secondaryLabel: "Completed successfully",
    variant: "success",
    prependContent: <Check size={20} />,
    style: { width: "400px" },
  },
};

export const InsideCard: Story = {
  render: () => (
    <Card style={{ width: "600px" }}>
      <Stack gap={4}>
        <Stack gap={1}>
          <Text weight="bold">Attached Files</Text>
          <Text style={{ color: "var(--muted-foreground)" }} variant="small">
            Documents for review
          </Text>
        </Stack>

        <Stack gap={2}>
          <Slat
            appendContent={<X size={20} style={{ cursor: "pointer" }} />}
            label="contract_v2.pdf"
            prependContent={<File color="#3b82f6" size={20} />}
            secondaryLabel="2.4 MB"
          />
          <Slat
            appendContent={<Badge variant="outline">Draft</Badge>}
            label="budget_sheet.xlsx"
            prependContent={<File color="#10b981" size={20} />}
            secondaryLabel="856 KB"
          />
          <Slat
            appendContent={
              <Text variant="small" weight="bold">
                Failed
              </Text>
            }
            label="image_assets.zip"
            prependContent={<File size={20} />}
            secondaryLabel="124 MB"
            variant="danger"
          />
        </Stack>
        <Flex justify="flex-end">
          <Button size="sm">Download All</Button>
        </Flex>
      </Stack>
    </Card>
  ),
};
