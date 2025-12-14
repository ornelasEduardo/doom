'use client';

import React from 'react';
import { Text } from '../Text/Text';
import { Flex } from '../Layout/Layout';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import styles from './ActionRow.module.scss';

interface ActionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

export function ActionRow({ icon, title, description, onClick, className, ...props }: ActionRowProps) {
  return (
    <Flex 
      align="center" 
      gap="1.5rem" 
      onClick={onClick} 
      className={clsx(styles.actionRow, className)}
      {...props}
    >
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <Flex direction="column" gap="0.25rem" style={{ flex: 1 }}>
        <Text variant="h6" weight="bold">
          {title}
        </Text>
        {description && (
          <Text color="muted" variant="small">
            {description}
          </Text>
        )}
      </Flex>
      <ChevronRight size={20} strokeWidth={2.5} style={{ color: 'var(--muted-foreground)' }} />
    </Flex>
  );
}
