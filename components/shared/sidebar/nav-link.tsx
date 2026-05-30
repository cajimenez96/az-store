'use client';

import { usePathname } from 'next/navigation';
import { SidebarMenuItem, SidebarMenuButton } from './nav-menu';
import type { NavLink } from '@/lib/navigation';

interface SidebarNavLinkProps {
  link: NavLink;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export function SidebarNavLink({ link, icon: Icon, onClick }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.includes(link.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} icon={Icon} onClick={onClick}>
        {link.title}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
