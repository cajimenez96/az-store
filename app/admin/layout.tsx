import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import { ADMIN_NAV_LINKS } from '@/lib/navigation';
import AdminSearch from '@/components/admin/admin-search';
import { SidebarLayout } from '@/components/shared/sidebar/sidebar-layout';
import { requireAdminOrSeller } from '@/lib/auth-guard';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminOrSeller();

  const headerContent = (
    <div className='flex items-center gap-4 w-full'>
      <div className='flex-1'>
        <AdminSearch />
      </div>

      <div className='flex items-center gap-3'>
        <Menu />
      </div>
    </div>
  );

  return (
    <SidebarLayout
      navigationLinks={ADMIN_NAV_LINKS}
      userRole={session?.user?.role}
      headerContent={headerContent}
      className='container mx-auto px-4 py-6'
    >
      {children}
    </SidebarLayout>
  );
}
