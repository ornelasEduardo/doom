'use client';

import React from 'react';
import clsx from 'clsx';
import styles from './Textarea.module.scss';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={clsx(styles.textarea, className)} {...props} />;
}
