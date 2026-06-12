'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'accent' | 'muted';
  className?: string;
}

export default function Badge({
  children,
  variant = 'accent',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'accent'
          ? 'bg-accent/15 text-accent'
          : 'bg-bg-surface text-muted border border-border',
        className
      )}
    >
      {children}
    </span>
  );
}
