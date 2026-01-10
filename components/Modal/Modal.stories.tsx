import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import { Textarea } from "../Textarea/Textarea";
import { Modal } from "./Modal";

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
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Confirm</Button>
            </>
          }
          isOpen={isOpen}
          title={
            <Text as="h2" className="mb-0" variant="h4">
              Example Modal
            </Text>
          }
          onClose={() => setIsOpen(false)}
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
        <Button color="secondary" onClick={() => setIsOpen(true)}>
          Send Feedback
        </Button>
        <Modal
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>SUBMIT FEEDBACK</Button>
            </>
          }
          isOpen={isOpen}
          title={
            <Text as="h2" className="mb-0" variant="h4">
              Send Feedback
            </Text>
          }
          onClose={() => setIsOpen(false)}
        >
          <Stack gap={6}>
            <Text>
              Help us improve! Your feedback helps us build better products.
            </Text>
            <Input
              required
              label="TITLE"
              maxLength={200}
              placeholder="Brief summary of your feedback..."
            />
            <Textarea
              required
              label="DESCRIPTION"
              maxLength={5000}
              placeholder="Share your thoughts, ideas, or issues in detail..."
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
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Open Custom Modal
        </Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Header>
            <Text as="h2" className="mb-0" variant="h3">
              Custom Composition
            </Text>
          </Modal.Header>
          <Modal.Body>
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
          </Modal.Body>
          <Modal.Footer>
            <Text variant="small">Custom Footer Content</Text>
            <Button onClick={() => setIsOpen(false)}>Got it</Button>
          </Modal.Footer>
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
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Solid Modal
        </Button>
        <Modal isOpen={isOpen} variant="solid" onClose={() => setIsOpen(false)}>
          <Modal.Header>
            <Text as="h2" className="mb-0" variant="h3">
              SOLID VARIANT
            </Text>
          </Modal.Header>
          <Modal.Body>
            <Stack gap={4}>
              <Text>
                This modal uses the <code>variant=&quot;solid&quot;</code> prop
                to create a unified, high-impact look.
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              DISMISS
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Understood
            </Button>
          </Modal.Footer>
        </Modal>
      </Stack>
    );
  },
};
