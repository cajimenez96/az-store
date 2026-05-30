export type NavLink = {
  title: string;
  href: string;
  icon?: React.ComponentType<any>;
  visibility?: 'always' | 'admin-only' | 'seller-only';
};

export const ADMIN_NAV_LINKS: NavLink[] = [
  { title: 'Dashboard', href: '/admin/overview' },
  { title: 'POS (Venta)', href: '/admin/pos' },
  { title: 'Productos', href: '/admin/products' },
  { title: 'Categorías', href: '/admin/categories' },
  { title: 'Marcas', href: '/admin/brands' },
  { title: 'Inventario', href: '/admin/inventory' },
  { title: 'Pedidos', href: '/admin/orders' },
  { title: 'Promociones', href: '/admin/promotions', visibility: 'admin-only' },
  { title: 'Usuarios', href: '/admin/users', visibility: 'admin-only' },
  { title: 'Settings', href: '/admin/settings', visibility: 'admin-only' },
];

export const USER_NAV_LINKS: NavLink[] = [
  { title: 'Perfil', href: '/user/profile' },
  { title: 'Pedidos', href: '/user/orders' },
  { title: 'Admin', href: '/admin', visibility: 'seller-only' },
];

export function filterLinksByRole(links: NavLink[], userRole?: string | null): NavLink[] {
  return links.filter(link => {
    if (!link.visibility || link.visibility === 'always') return true;
    if (link.visibility === 'admin-only') return userRole === 'admin';
    if (link.visibility === 'seller-only') return userRole === 'seller';
    return true;
  });
}
