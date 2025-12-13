import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {  Form, FormGroup, Label  } from 'doom-design-system';
import {  Input  } from 'doom-design-system';
import {  Button, Switch  } from 'doom-design-system';

const meta: Meta<typeof Form> = {
  title: 'Design System/Form',
  component: Form,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    const [rememberMe, setRememberMe] = React.useState(false);

    return (
      <Form>
        <FormGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter your password" />
        </FormGroup>
        <FormGroup>
          <Switch 
            id="remember" 
            label="Remember me" 
            checked={rememberMe} 
            onChange={setRememberMe} 
          />
        </FormGroup>
        <Button type="submit">Submit</Button>
      </Form>
    );
  },
};
