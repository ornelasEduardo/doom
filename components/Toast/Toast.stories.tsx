import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "doom-design-system";
import { Button } from "doom-design-system";
import { Flex } from "doom-design-system";

const meta: Meta<typeof ToastProvider> = {
  title: "Components/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

export const Default: Story = {
  render: () => {
    // Inner component to use the toast hook
    const ToastButtons = () => {
      const { toastSuccess, toastError, toastWarning, toastInfo } = useToast();

      return (
        <Flex gap={4} wrap="wrap">
          <Button
            variant="success"
            onClick={() => toastSuccess("Operation successful!")}
          >
            Success Toast
          </Button>
          <Button
            variant="danger"
            onClick={() => toastError("Something went wrong!")}
          >
            Error Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toastWarning("Warning: Check this out.")}
          >
            Warning Toast
          </Button>
          <Button
            variant="ghost"
            onClick={() => toastInfo("Just some information.")}
          >
            Info Toast
          </Button>
        </Flex>
      );
    };

    return (
      <ToastProvider>
        <div style={{ height: "300px", padding: "2rem" }}>
          <ToastButtons />
        </div>
      </ToastProvider>
    );
  },
};
