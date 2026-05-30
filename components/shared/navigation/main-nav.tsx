'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavLink } from '@/lib/navigation';
import { filterLinksByRole } from '@/lib/navigation';

export interface MainNavProps {
  links: NavLink[];
  userRole?: string | null;
  variant?: 'admin' | 'user';
  className?: string;
}

export function MainNav({
  links,
  userRole,
  variant = 'user',
  className,
}: MainNavProps) {
  const pathname = usePathname();
  const filteredLinks = filterLinksByRole(links, userRole);

  const isAdminVariant = variant === 'admin';
  const baseContainerClass = cn(
    'flex items-center transition-all duration-150',
    isAdminVariant ? 'gap-1 overflow-x-auto scrollbar-none' : 'space-x-4 lg:space-x-6',
    className
  );

  const getLinkClass = (isActive: boolean) => {
    if (isAdminVariant) {
      return cn(
        'az-caption-bold px-3 py-1.5 rounded-az-full whitespace-nowrap',
        isActive ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white hover:bg-white/10'
      );
    } else {
      return cn(
        'az-body-sm transition-colors hover:text-az-ink-deep',
        isActive ? 'text-az-ink-deep az-body-sm-bold' : 'text-az-stone'
      );
    }
  };

  return (
    <nav className={baseContainerClass}>
      {filteredLinks.map(link => {
        const isActive = pathname.includes(link.href);
        return (
          <Link key={link.href} href={link.href} className={getLinkClass(isActive)}>
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
