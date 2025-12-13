import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Design System/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'radio',
      options: ['single', 'multiple'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: (args) => (
    <div style={{ width: '400px' }}>
      <Accordion {...args} type="single" defaultValue="item-1">
        <AccordionItem value="item-1" trigger="Is it accessible?">
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionItem>
        <AccordionItem value="item-2" trigger="Is it styled?">
          Yes. It adheres to the neubrutalist design system with hard borders and high contrast.
        </AccordionItem>
        <AccordionItem value="item-3" trigger="Is it filterable?">
          Not inherently. This leads into the Combobox pattern for searchable lists.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Multiple: Story = {
  render: (args) => (
    <div style={{ width: '400px' }}>
      <Accordion {...args} type="multiple" defaultValue={['item-1', 'item-2']}>
        <AccordionItem value="item-1" trigger="Notifications">
          Manage your email and push notification settings.
        </AccordionItem>
        <AccordionItem value="item-2" trigger="Privacy">
          Choose what data you share with the community.
        </AccordionItem>
        <AccordionItem value="item-3" trigger="Security">
          Update your password and 2FA settings.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
