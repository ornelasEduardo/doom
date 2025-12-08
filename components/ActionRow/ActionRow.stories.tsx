import type { Meta, StoryObj } from '@storybook/react';
import { ActionRow } from './ActionRow';
import { Banknote, Settings, User } from 'lucide-react';

const meta: Meta<typeof ActionRow> = {
  title: 'Design System/ActionRow',
  component: ActionRow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ActionRow>;

export const Default: Story = {
  args: {
    icon: <Banknote size={24} strokeWidth={2.5} />,
    title: 'Income Sources',
    description: 'Manage your paychecks, bonuses, and other income streams',
  },
};

export const NoDescription: Story = {
  args: {
    icon: <Settings size={24} strokeWidth={2.5} />,
    title: 'General Settings',
  },
};

export const LongText: Story = {
  args: {
    icon: <User size={24} strokeWidth={2.5} />,
    title: 'Account Information',
    description: 'This is a very long description that might wrap to multiple lines depending on the container width. It is important to test how the component behaves with extensive text content.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export const InList: Story = {
  render: () => (
    <div style={{ width: '500px', border: 'var(--border-width) solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <ActionRow
        icon={<Banknote size={24} strokeWidth={2.5} />}
        title="Income Sources"
        description="Manage your paychecks and bonuses"
      />
      <ActionRow
        icon={<Settings size={24} strokeWidth={2.5} />}
        title="Preferences"
        description="Customize your dashboard experience"
      />
      <ActionRow
        icon={<User size={24} strokeWidth={2.5} />}
        title="Profile"
        description="Update your personal information"
      />
    </div>
  ),
};
