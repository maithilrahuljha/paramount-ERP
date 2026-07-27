/**
 * PMN ERP Platform - Badge Component
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      secondary: 'bg-purple-100 text-purple-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

/**
 * Get badge variant based on lead status
 */
export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'new':
      return 'info';
    case 'assigned':
    case 'contacted':
      return 'secondary';
    case 'qualified':
    case 'counselling':
    case 'admission_ready':
      return 'warning';
    case 'converted':
      return 'success';
    case 'lost':
      return 'danger';
    case 'archived':
    case 'follow_up':
    default:
      return 'default';
  }
}

/**
 * Get badge variant based on task priority
 */
export function getPriorityBadgeVariant(priority: string): BadgeProps['variant'] {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'normal':
      return 'info';
    case 'low':
    default:
      return 'default';
  }
}
