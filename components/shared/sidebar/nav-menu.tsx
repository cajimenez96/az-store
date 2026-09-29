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
  onClick?: () => void;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  icon: Icon,
  className,
  onClick,
}: SidebarMenuButtonProps) {
  const { isCollapsed } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium',
        'transition-all duration-200 ease-in-out',
        'text-[#707072] hover:text-[#111111] hover:bg-[#f5f5f5]',
        isActive && 'bg-[#111111] text-white hover:bg-[#111111] hover:text-white font-medium shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
        isCollapsed && 'justify-center gap-0 px-2',
        className
      )}
      title={isCollapsed && typeof children === 'string' ? (children as string) : undefined}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform duration-200',
            isCollapsed && 'h-5 w-5',
            isActive ? 'text-white' : 'text-current'
          )}
        />
      )}
      {!isCollapsed && <span className='truncate text-xs tracking-wide uppercase font-semibold'>{children}</span>}
    </button>
  );
}
