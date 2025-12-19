import type { Meta, StoryObj } from '@storybook/react';
import { Flex, Grid, Stack, Container } from './Layout';
import { Text } from '../Text';

const meta: Meta<typeof Flex> = {
  title: 'Design System/Layout',
  component: Flex,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Flex>;

const Box = ({ children, color = '#e0e7ff' }: { children: React.ReactNode, color?: string }) => (
  <div style={{ padding: '1.5rem', background: color, border: '2px solid #000', borderRadius: '4px' }}>
    <Text>{children}</Text>
  </div>
);

export const FlexRow: Story = {
  render: () => (
    <Flex gap="1rem" wrap>
      <Box>Flex Item 1</Box>
      <Box>Flex Item 2</Box>
      <Box>Flex Item 3</Box>
    </Flex>
  )
};

export const VerticalStack: Story = {
  render: () => (
    <Stack gap="1rem">
      <Box>Stack Item 1</Box>
      <Box>Stack Item 2</Box>
      <Box>Stack Item 3</Box>
    </Stack>
  )
};

export const GridLayout: Story = {
  render: () => (
    <Grid columns={3} gap="1rem">
      <Box>Grid 1</Box>
      <Box>Grid 2</Box>
      <Box>Grid 3</Box>
      <Box>Grid 4</Box>
      <Box>Grid 5</Box>
      <Box>Grid 6</Box>
    </Grid>
  ),
};

export const ContainerExample: Story = {
  render: () => (
    <Stack gap="2rem" style={{ background: '#eee', padding: '1rem' }}>
      <Container maxWidth="sm" style={{ border: '2px dashed red' }}>
        <Box color="white">Small Container (sm)</Box>
      </Container>
      
      <Container maxWidth="md" style={{ border: '2px dashed blue' }}>
         <Box color="white">Medium Container (md)</Box>
      </Container>
      
      <Container maxWidth="lg" style={{ border: '2px dashed green' }}>
         <Box color="white">Large Container (lg)</Box>
      </Container>
    </Stack>
  )
};
