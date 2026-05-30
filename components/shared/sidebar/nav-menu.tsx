'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar';

interface SidebarMenuProps {
  children: ReactNode;
  className?: string;
}

export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <ul className={cn('space-y-1', className)}>
      {children}
    </ul>
  );
}

interface SidebarMenuItemProps {
  children: ReactNode;
  className?: string;
}

export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return (
    <li className={cn('', className)}>
      {children}
    </li>
  );
}

interface SidebarMenuButtonProps {
  children: ReactNode;
  isActive?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  icon: Icon,
  className,
}: SidebarMenuButtonProps) {
  const { isCollapsed } = useSidebar();

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-az-md text-sm font-medium',
        'transition-all duration-200 ease-in-out',
        'text-az-stone hover:text-az-ink-deep hover:bg-az-surface-soft',
        isActive && 'bg-az-primary/10 text-az-primary font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-az-primary/50',
        isCollapsed && 'justify-center gap-0 px-2',
        className
      )}
      title={isCollapsed && typeof children === 'string' ? (children as string) : undefined}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
            isCollapsed && 'h-5 w-5',
            isActive && 'text-az-primary'
          )}
        />
      )}
      {!isCollapsed && <span className='truncate'>{children}</span>}
    </button>
  );
}
