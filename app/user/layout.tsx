import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import { USER_NAV_LINKS } from '@/lib/navigation';
import { SidebarLayout } from '@/components/shared/sidebar/sidebar-layout';
import { auth } from '@/auth';

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userRole = session?.user?.role;

  const headerContent = (
    <div className='flex items-center gap-6 w-full'>
      <Link href='/' className='w-22'>
        <Image
          src='/images/logo-m-blanco.png'
          height={32}
          width={32}
          alt={APP_NAME}
          className='brightness-0 invert'
        />
      </Link>

      <div className='ml-auto items-center flex space-x-4'>
        <Menu />
      </div>
    </div>
  );

  return (
    <SidebarLayout
      navigationLinks={USER_NAV_LINKS}
      userRole={userRole}
      headerContent={headerContent}
      className='space-y-4 p-8 pt-6 container mx-auto max-w-7xl'
    >
      {children}
    </SidebarLayout>
  );
}
