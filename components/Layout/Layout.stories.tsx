import type { Meta, StoryObj } from '@storybook/react';
import {  Flex, Grid  } from '../..';

import {  Text  } from '../..';

const meta: Meta<typeof Flex> = {
  title: 'Design System/Layout',
  component: Flex,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Flex>;

const Box = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '1rem', background: '#e0e7ff', border: '1px solid #000' }}>
    <Text>{children}</Text>
  </div>
);

export const FlexRow: Story = {
  render: (args) => (
    <Flex {...args} gap="1rem">
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Flex>
  ),
  args: {
    direction: 'row',
  },
};

export const FlexColumn: Story = {
  render: (args) => (
    <Flex {...args} gap="1rem">
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Flex>
  ),
  args: {
    direction: 'column',
  },
};

export const GridLayout: Story = {
  render: () => (
    <Grid columns="1fr 1fr 1fr" gap="1rem">
      <Box>Column 1</Box>
      <Box>Column 2</Box>
      <Box>Column 3</Box>
      <Box>Column 4</Box>
      <Box>Column 5</Box>
      <Box>Column 6</Box>
    </Grid>
  ),
};
