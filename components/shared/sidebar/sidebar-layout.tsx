'use client';

import Image from 'next/image';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
  Package,
  FolderOpen,
  Palette,
  TrendingUp,
  ShoppingBag,
  Gift,
  Users,
  Settings,
  User,
  ShoppingCart,
  Lock,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from './sidebar';
import type { NavLink } from '@/lib/navigation';
import { filterLinksByRole } from '@/lib/navigation';
import { SidebarMenu } from './nav-menu';
import { SidebarNavLink } from './nav-link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

// Icon map using lucide-react icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  '/admin/overview': BarChart3,
  '/admin/pos': CreditCard,
  '/admin/products': Package,
  '/admin/categories': FolderOpen,
  '/admin/brands': Palette,
  '/admin/inventory': TrendingUp,
  '/admin/orders': ShoppingBag,
  '/admin/promotions': Gift,
  '/admin/users': Users,
  '/admin/settings': Settings,
  '/user/profile': User,
  '/user/orders': ShoppingCart,
  '/admin': Lock,
};

interface SidebarLayoutProps {
  children: ReactNode;
  navigationLinks: NavLink[];
  userRole?: string | null;
  headerContent?: ReactNode;
  className?: string;
}

function SidebarLogo() {
  const { isCollapsed } = useSidebar();

  return (
    <div className='flex items-center justify-center h-16 px-2'>
      {isCollapsed ? (
        <Image
          src='/images/logo-m-negro.png'
          alt='AZ'
          width={40}
          height={40}
          className='object-contain'
        />
      ) : (
        <Image
          src='/images/logo-nombre.png'
          alt='AZ Marketing'
          width={300}
          height={60}
          className='object-contain'
        />
      )}
    </div>
  );
}

function SidebarLayoutContent({
  children,
  navigationLinks,
  userRole,
  headerContent,
  className,
}: SidebarLayoutProps) {
  const router = useRouter();
  const { setIsOpen } = useSidebar();
  const isMobile = useIsMobile();
  const filteredLinks = filterLinksByRole(navigationLinks, userRole);

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <div className='flex h-screen bg-az-canvas'>
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <SidebarLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredLinks.map((link) => (
              <SidebarNavLink
                key={link.href}
                link={link}
                icon={ICON_MAP[link.href]}
                onClick={() => handleNavClick(link.href)}
              />
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className='flex flex-col flex-1 overflow-hidden'>
        {/* Header */}
        <header className='sticky top-0 z-40 bg-az-canvas border-b border-az-hairline-soft'>
          <div className='flex items-center justify-between h-14 px-4 gap-3'>
            <SidebarTrigger />
            <div className='flex-1'>{headerContent}</div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1 overflow-y-auto', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarLayoutContent {...props} />
    </SidebarProvider>
  );
}
