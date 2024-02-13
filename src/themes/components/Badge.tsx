import clsx from 'clsx';
import { ReactNode } from 'react';

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span className={clsx('inline-block px-2 py-1 bg-primary-300 dark:bg-primary-900 rounded-lg', className)}>
      {children}
    </span>
  );
}
