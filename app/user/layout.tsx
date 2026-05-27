import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';
import { auth } from '@/auth';

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userRole = session?.user?.role;

  return (
    <div className='bg-az-surface-soft min-h-screen flex flex-col text-az-ink'>
      <div className='border-b border-az-hairline-soft bg-az-canvas'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center h-16'>
            <Link href='/' className='w-22'>
              <Image
                src='/images/logo.svg'
                height={48}
                width={48}
                alt={APP_NAME}
              />
            </Link>
            <MainNav className='mx-6' userRole={userRole} />
            <div className='ml-auto items-center flex space-x-4'>
              <Menu />
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 space-y-4 p-8 pt-6 container mx-auto max-w-7xl'>
        {children}
      </div>
    </div>
  );
}
