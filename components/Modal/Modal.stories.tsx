import type { Meta, StoryObj } from "@storybook/react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Stack } from "../Layout/Layout";
import { Input } from "../Input/Input";
import { Textarea } from "../Textarea/Textarea";
import { useState } from "react";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
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
          <Stack gap={4}>
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
  },
};

export const FeedbackForm: Story = {
  render: () => {
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
          <Stack gap={6}>
            <Text>
              Help us improve! Your feedback helps us build better products.
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
  },
};

export const CustomComposition: Story = {
  render: () => {
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
            <Stack gap={4}>
              <Text>
                This modal is built by composing <code>ModalHeader</code>,{" "}
                <code>ModalBody</code>, and <code>ModalFooter</code> manually
                instead of using props.
              </Text>
              <div
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
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
  },
};

export const SolidVariant: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Stack align="center" justify="center" style={{ minHeight: "200px" }}>
        <Button onClick={() => setIsOpen(true)} variant="primary">
          Open Solid Modal
        </Button>
        <Modal variant="solid" isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader>
            <Text variant="h3" as="h2" className="mb-0">
              SOLID VARIANT
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack gap={4}>
              <Text>
                This modal uses the <code>variant="solid"</code> prop to create
                a unified, high-impact look.
              </Text>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  padding: "1rem",
                  border: "2px solid var(--card-border)",
                  fontWeight: "bold",
                }}
              >
                Perfect for announcements or critical alerts!
              </div>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              DISMISS
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Understood
            </Button>
          </ModalFooter>
        </Modal>
      </Stack>
    );
  },
};
