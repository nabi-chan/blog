import clsx from 'clsx';
import { ReactNode } from 'react';

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-1 bg-blue-300 dark:bg-blue-900 dark:text-white rounded-lg text-blue-950',
        className,
      )}
    >
      {children}
    </span>
  );
}
