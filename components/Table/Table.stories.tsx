import type { Meta, StoryObj } from '@storybook/react';
import {  Table  } from 'doom-design-system';
import { createColumnHelper } from '@tanstack/react-table';

const meta: Meta<typeof Table> = {
  title: 'Design System/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: info => info.renderValue(),
  }),
  columnHelper.accessor('visits', {
    header: 'Visits',
    cell: info => info.renderValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('progress', {
    header: 'Profile Progress',
    cell: info => info.renderValue(),
  }),
];

const data: Person[] = [
  {
    firstName: 'Tanner',
    lastName: 'Linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'Tandy',
    lastName: 'Miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'Joe',
    lastName: 'Dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
];

export const Default: Story = {
  args: {
    data,
    columns: columns as any,
    density: 'standard',
  },
};

export const Compact: Story = {
  args: {
    data,
    columns: columns as any,
    density: 'compact',
  },
};

export const Relaxed: Story = {
  args: {
    data,
    columns: columns as any,
    density: 'relaxed',
  },
};

export const Flat: Story = {
  args: {
    data,
    columns: columns as any,
    variant: 'flat',
  },
};
