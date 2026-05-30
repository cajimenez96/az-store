'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  const isMobile = useIsMobile();
  const { isOpen, setIsOpen, isCollapsed } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side='left'
          className={cn(
            'w-64 overflow-y-auto bg-az-canvas text-az-ink p-0 shadow-lg',
            className
          )}
        >
          <div className='py-6 space-y-2'>{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-az-canvas border-r border-az-hairline-soft transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarTrigger() {
  const isMobile = useIsMobile();
  const { setIsOpen, isCollapsed, setIsCollapsed } = useSidebar();

  if (isMobile) {
    return (
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(true)}
        className='h-10 w-10 hover:bg-az-surface-soft transition-colors duration-200'
        aria-label='Open navigation menu'
      >
        <Menu className='h-5 w-5 text-az-ink' />
      </Button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setIsCollapsed(!isCollapsed)}
      className='h-10 w-10 hover:bg-az-surface-soft transition-colors duration-200'
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <Menu className='h-5 w-5 text-az-ink transition-transform duration-200' />
    </Button>
  );
}

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-4 py-6 transition-all duration-300',
        isCollapsed && 'px-2 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface SidebarGroupProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function SidebarGroup({ children, label, className }: SidebarGroupProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn('mb-6', className)}>
      {label && !isCollapsed && (
        <h3 className='mb-3 px-2 text-xs font-semibold text-az-stone uppercase tracking-wider'>
          {label}
        </h3>
      )}
      {children}
    </div>
  );
}

interface SidebarHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div className={cn('border-b border-az-hairline-soft px-4 py-4', className)}>
      {children}
    </div>
  );
}

interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn('border-t border-az-hairline-soft mt-auto px-4 py-4', className)}>
      {children}
    </div>
  );
}
