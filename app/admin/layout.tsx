import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';
import AdminSearch from '@/components/admin/admin-search';
import { auth } from '@/auth';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className='flex flex-col min-h-screen bg-az-surface-soft'>
      {/* Admin top bar */}
      <header className='sticky top-0 z-50 bg-[#0a1317] border-b border-white/10'>
        <div className='container mx-auto'>
          <div className='flex items-center h-14 px-4 gap-4'>
            <Link href='/' className='flex items-center gap-2 shrink-0'>
              <Image
                src='/images/logo.svg'
                height={32}
                width={32}
                alt={APP_NAME}
                className='brightness-0 invert'
              />
              <span className='hidden lg:block az-caption-bold text-white/70 uppercase tracking-widest'>
                Admin
              </span>
            </Link>

            <div className='w-px h-5 bg-white/20 hidden md:block' />

            <MainNav className='mx-2 flex-1' role={session?.user?.role} />

            <div className='ml-auto flex items-center gap-3'>
              <AdminSearch />
              <Menu />
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className='flex-1 container mx-auto px-4 py-6'>
        {children}
      </main>
    </div>
  );
}
