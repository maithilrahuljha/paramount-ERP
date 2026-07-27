/**
 * PMN ERP Platform - Avatar Component
 */

import { type HTMLAttributes, forwardRef } from 'react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    const initials = getInitials(name);
    const bgColor = name ? getAvatarColor(name) : 'bg-gray-400';

    if (src) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative rounded-full overflow-hidden flex-shrink-0',
            sizes[size],
            className
          )}
          {...props}
        >
          <img
            src={src}
            alt={name ?? 'Avatar'}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full flex items-center justify-center text-white font-medium flex-shrink-0',
          sizes[size],
          bgColor,
          className
        )}
        {...props}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
