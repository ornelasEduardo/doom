import type { Meta, StoryObj } from '@storybook/react';
import {  Modal  } from 'doom-design-system';
import {  Button  } from 'doom-design-system';
import {  Text  } from 'doom-design-system';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </div>
        }
      >
        <Text>This is the content of the modal.</Text>
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => <ModalExample />,
};
