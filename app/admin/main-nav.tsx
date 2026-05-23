'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const links = [
  {
    title: 'Dashboard',
    href: '/admin/overview',
  },
  {
    title: 'Productos',
    href: '/admin/products',
  },
  {
    title: 'Categorías',
    href: '/admin/categories',
  },
  {
    title: 'Marcas',
    href: '/admin/brands',
  },
  {
    title: 'Inventario',
    href: '/admin/inventory',
  },
  {
    title: 'Pedidos',
    href: '/admin/orders',
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
  },
];

const MainNav = ({
  className,
  role,
  ...props
}: React.HTMLAttributes<HTMLElement> & { role?: string }) => {
  const pathname = usePathname();

  const filteredLinks = links.filter((item) => {
    if (role === 'seller') {
      if (item.title === 'Categorías' || item.title === 'Marcas' || item.title === 'Usuarios') return false;
    }
    return true;
  });

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {filteredLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname.includes(item.href) ? '' : 'text-muted-foreground'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
