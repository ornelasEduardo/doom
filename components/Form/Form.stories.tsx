import type { Meta, StoryObj } from '@storybook/react';
import {  Form, FormGroup, Label  } from '../..';
import {  Input  } from '../..';
import {  Button  } from '../..';

const meta: Meta<typeof Form> = {
  title: 'Design System/Form',
  component: Form,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => (
    <Form>
      <FormGroup>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter your password" />
      </FormGroup>
      <Button type="submit">Submit</Button>
    </Form>
  ),
};
