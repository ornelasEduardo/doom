import type { Meta, StoryObj } from '@storybook/react';
import {  Tabs, TabsList, TabsTrigger, TabsContent, TabsBody  } from '../..';
import {  Text  } from '../..';

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsBody>
        <TabsContent value="account">
          <Text variant="h4">Account</Text>
          <Text>Make changes to your account here.</Text>
        </TabsContent>
        <TabsContent value="password">
          <Text variant="h4">Password</Text>
          <Text>Change your password here.</Text>
        </TabsContent>
        <TabsContent value="settings">
          <Text variant="h4">Settings</Text>
          <Text>Manage your settings here.</Text>
        </TabsContent>
      </TabsBody>
    </Tabs>
  ),
};
