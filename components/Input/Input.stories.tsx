import type { Meta, StoryObj } from '@storybook/react';
import {  Input  } from 'doom-design-system';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    helperText: 'Must be at least 8 characters',
  },
};

export const WithStartAdornment: Story = {
  args: {
    label: 'Price',
    startAdornment: '$',
    placeholder: '0.00',
  },
};

export const WithEndAdornment: Story = {
  args: {
    label: 'Weight',
    endAdornment: 'kg',
    placeholder: '0',
  },
};
export const Required: Story = {
  args: {
    label: 'Required Field',
    required: true,
    placeholder: 'This field has an asterisk',
  },
};
