import type { Meta, StoryObj } from '@storybook/react';
import {  Badge  } from 'doom-design-system';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning Badge',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Badge',
  },
};
