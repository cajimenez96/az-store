import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Menu from './menu';
import Search from './search';

const Header = () => {
  return (
    <header className='sticky top-0 z-50 bg-az-canvas border-b border-az-hairline-soft'>
      <div className='az-wrapper flex items-center justify-between h-16 gap-4 lg:gap-8'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-3 shrink-0'>
          {/* <Image
            src='/images/logo-m-negro.png'
            alt={`${APP_NAME} logo`}
            height={50}
            width={50}
            priority
          /> */}
          <span className='hidden lg:block font-serif font-bold text-az-ink-deep uppercase tracking-[0.1em] text-xl leading-none'>
            {APP_NAME}
          </span>
        </Link>

        {/* Global Search */}
        <div className='hidden md:block flex-1 max-w-2xl mx-auto'>
          <Search />
        </div>

        {/* Right: menu/user actions */}
        <Menu />
      </div>

      {/* Mobile Search (visible only on mobile, below the main header bar) */}
      <div className='md:hidden px-4 pb-3'>
        <Search />
      </div>
    </header>
  );
};

export default Header;
