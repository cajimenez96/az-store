'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const links = [
  {
    title: 'Perfil',
    href: '/user/profile',
  },
  {
    title: 'Pedidos',
    href: '/user/orders',
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'az-body-sm transition-colors hover:text-az-ink-deep',
            pathname.includes(item.href)
              ? 'text-az-ink-deep az-body-sm-bold'
              : 'text-az-stone'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
