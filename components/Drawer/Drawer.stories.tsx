import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';
import { Button } from '../Button';

const meta: Meta<typeof Drawer> = {
  title: 'Design System/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'radio',
      options: ['left', 'right'],
    },
    isOpen: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer 
          {...args} 
          isOpen={open} 
          onClose={() => setOpen(false)} 
          title="Settings"
        >
          <p>Here you can configure your profile settings.</p>
          <p>Drawers are great for secondary actions that don't lose context.</p>
        </Drawer>
      </>
    );
  }
};

export const LeftSide: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Left Drawer</Button>
        <Drawer 
          {...args} 
          side="left"
          isOpen={open} 
          onClose={() => setOpen(false)} 
          title="Navigation"
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <ul>
            <li>Dashboard</li>
            <li>Profile</li>
            <li>Settings</li>
          </ul>
        </Drawer>
      </>
    );
  }
};
