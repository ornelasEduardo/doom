import type { Meta, StoryObj } from "@storybook/react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
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

const CustomCompositionExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Stack align="center" justify="center" style={{ minHeight: "200px" }}>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Open Custom Modal
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <Text variant="h3" as="h2" className="mb-0">
            Custom Composition
          </Text>
        </ModalHeader>
        <ModalBody>
          <Stack gap="1rem">
            <Text>
              This modal is built by composing <code>ModalHeader</code>,{" "}
              <code>ModalBody</code>, and <code>ModalFooter</code> manually
              instead of using props.
            </Text>
            <div
              style={{
                background: "var(--primary)",
                padding: "1rem",
                border: "2px solid black",
                fontWeight: "bold",
              }}
            >
              It allows for completely custom layouts!
            </div>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Text variant="small">Custom Footer Content</Text>
          <Button onClick={() => setIsOpen(false)}>Got it</Button>
        </ModalFooter>
      </Modal>
    </Stack>
  );
};

export const CustomComposition: Story = {
  render: () => <CustomCompositionExample />,
};
