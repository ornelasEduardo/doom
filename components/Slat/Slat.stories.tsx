import type { Meta, StoryObj } from "@storybook/react";
import { Slat } from "./Slat";
import { File, Check, AlertTriangle, X } from "lucide-react";
import { Badge } from "../Badge/Badge";
import { Card } from "../Card/Card";
import { Stack, Flex } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Button } from "../Button/Button";

const meta: Meta<typeof Slat> = {
  title: "Design System/Slat",
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
      <Stack gap="var(--spacing-md)">
        <Stack gap="var(--spacing-xs)">
          <Text weight="bold">Attached Files</Text>
          <Text variant="small" style={{ color: "var(--muted-foreground)" }}>
            Documents for review
          </Text>
        </Stack>

        <Stack gap="var(--spacing-sm)">
          <Slat
            label="contract_v2.pdf"
            secondaryLabel="2.4 MB"
            prependContent={<File size={20} color="#3b82f6" />}
            appendContent={<X size={20} style={{ cursor: "pointer" }} />}
          />
          <Slat
            label="budget_sheet.xlsx"
            secondaryLabel="856 KB"
            prependContent={<File size={20} color="#10b981" />}
            appendContent={<Badge variant="outline">Draft</Badge>}
          />
          <Slat
            label="image_assets.zip"
            secondaryLabel="124 MB"
            prependContent={<File size={20} />}
            variant="danger"
            appendContent={
              <Text variant="small" weight="bold">
                Failed
              </Text>
            }
          />
        </Stack>
        <Flex justify="flex-end">
          <Button size="sm">Download All</Button>
        </Flex>
      </Stack>
    </Card>
  ),
};
