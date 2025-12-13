import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Design System/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    currentPage: { control: 'number' },
    totalPages: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
  },
  render: function Render(args) {
    const [page, setPage] = useState(args.currentPage);
    
    return (
      <Pagination 
        {...args} 
        currentPage={page} 
        onPageChange={(p) => setPage(p)} 
      />
    );
  }
};

export const Short: Story = {
  args: {
    currentPage: 2,
    totalPages: 5,
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 15,
    totalPages: 50,
  },
  render: function Render(args) {
    const [page, setPage] = useState(args.currentPage);
    
    return (
      <Pagination 
        {...args} 
        currentPage={page} 
        onPageChange={(p) => setPage(p)} 
      />
    );
  }
};
