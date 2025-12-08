import type { Meta, StoryObj } from '@storybook/react';
import {  Text  } from '../..';

const meta: Meta<typeof Text> = {
  title: 'Design System/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'caption'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold', 'black'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'error', 'success', 'warning'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    as: {
        control: 'select',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'label'],
    }
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: 'Default Text',
  },
};

export const Headings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text variant="h1">Heading 1</Text>
      <Text variant="h2">Heading 2</Text>
      <Text variant="h3">Heading 3</Text>
      <Text variant="h4">Heading 4</Text>
      <Text variant="h5">Heading 5</Text>
      <Text variant="h6">Heading 6</Text>
    </div>
  ),
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text. It is the default text style.',
  },
};

export const Small: Story = {
  args: {
    variant: 'small',
    children: 'This is small text.',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'This is caption text.',
  },
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text color="primary">Primary Color</Text>
      <Text color="secondary">Secondary Color</Text>
      <Text color="muted">Muted Color</Text>
      <Text color="error">Error Color</Text>
      <Text color="success">Success Color</Text>
      <Text color="warning">Warning Color</Text>
    </div>
  ),
};
