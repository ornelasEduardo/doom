import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Stack } from "../Layout/Layout";
import { Input } from "../Input/Input";
import { Textarea } from "../Textarea/Textarea";
import { Label } from "../Label/Label";
import { useState } from "react";

const meta: Meta<typeof Modal> = {
  title: "Design System/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Stack align="center" justify="center" style={{ minHeight: "200px" }}>
      <Button onClick={() => setIsOpen(true)}>Open Default Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <Text variant="h4" as="h2" className="mb-0">
            Example Modal
          </Text>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </>
        }
      >
        <Stack gap="var(--spacing-md)">
          <Text>
            This is a simple modal demonstration using our neubrutalist design
            system.
          </Text>
          <Text>
            This is the content of the modal. It looks best when combined with
            our other components like Cards and Inputs.
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
};

export const Default: Story = {
  render: () => <ModalExample />,
};

const FeedbackFormExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Stack align="center" justify="center" style={{ minHeight: "200px" }}>
      <Button onClick={() => setIsOpen(true)} color="secondary">
        Send Feedback
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <Text variant="h4" as="h2" className="mb-0">
            Send Feedback
          </Text>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>SUBMIT FEEDBACK</Button>
          </>
        }
      >
        <Stack gap="var(--spacing-lg)">
          <Text>
            Help us improve Bit Buddies! Your feedback creates a Linear issue
            for our team.
          </Text>
          <Input
            label="TITLE"
            placeholder="Brief summary of your feedback..."
            maxLength={200}
            required
          />
          <Textarea
            label="DESCRIPTION"
            placeholder="Share your thoughts, ideas, or issues in detail..."
            maxLength={5000}
            required
          />
        </Stack>
      </Modal>
    </Stack>
  );
};

export const FeedbackForm: Story = {
  render: () => <FeedbackFormExample />,
};
