'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const links = [
  { title: 'Dashboard', href: '/admin/overview' },
  { title: 'POS (Venta)', href: '/admin/pos' },
  { title: 'Productos', href: '/admin/products' },
  { title: 'Categorías', href: '/admin/categories' },
  { title: 'Marcas', href: '/admin/brands' },
  { title: 'Inventario', href: '/admin/inventory' },
  { title: 'Pedidos', href: '/admin/orders' },
  { title: 'Usuarios', href: '/admin/users', adminOnly: true },
  { title: 'Settings', href: '/admin/settings', adminOnly: true },
];

const MainNav = ({
  className,
  role,
  ...props
}: React.HTMLAttributes<HTMLElement> & { role?: string }) => {
  const pathname = usePathname();

  const filteredLinks = links.filter((item) => {
    if ('adminOnly' in item && item.adminOnly && role !== 'admin') return false;
    return true;
  });

  return (
    <nav
      className={cn('flex items-center gap-1 overflow-x-auto scrollbar-none', className)}
      {...props}
    >
      {filteredLinks.map((item) => {
        const isActive = pathname.includes(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'az-caption-bold px-3 py-1.5 rounded-az-full whitespace-nowrap transition-all duration-150',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:text-white hover:bg-white/10'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNav;
