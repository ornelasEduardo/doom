import type { Meta, StoryObj } from '@storybook/react';
import {  ToastProvider, useToast  } from '../..';
import {  Button  } from '../..';
import {  Flex  } from '../..';

const meta: Meta<typeof ToastProvider> = {
  title: 'Design System/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

const ToastDemo = () => {
  const { toastSuccess, toastError, toastWarning, toastInfo } = useToast();

  return (
    <Flex gap="1rem" wrap>
      <Button variant="success" onClick={() => toastSuccess('Operation successful!')}>
        Success Toast
      </Button>
      <Button variant="primary" onClick={() => toastError('Something went wrong!')}>
        Error Toast
      </Button>
      <Button variant="secondary" onClick={() => toastWarning('Warning: Check this out.')}>
        Warning Toast
      </Button>
      <Button variant="ghost" onClick={() => toastInfo('Just some information.')}>
        Info Toast
      </Button>
    </Flex>
  );
};

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <div style={{ height: '300px', padding: '2rem' }}>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};
