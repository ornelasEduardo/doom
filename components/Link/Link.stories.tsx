import type { Meta, StoryObj } from '@storybook/react';
import {  Link  } from 'doom-design-system';

const meta: Meta<typeof Link> = {
  title: 'Design System/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'button', 'subtle'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: '#',
    children: 'Default Link',
  },
};

export const ButtonVariant: Story = {
  args: {
    href: '#',
    variant: 'button',
    children: 'Button Link',
  },
};

export const Subtle: Story = {
  args: {
    href: '#',
    variant: 'subtle',
    children: 'Subtle Link',
  },
};
