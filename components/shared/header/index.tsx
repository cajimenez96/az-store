import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Menu from './menu';
import Search from './search';

const Header = () => {
  return (
    <header className='sticky top-0 z-50 bg-white/95 dark:bg-nike-ink/95 backdrop-blur-md border-b border-nike-hairline-soft dark:border-nike-ash/20 transition-colors'>
      <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2 shrink-0 group'>
          <span className='font-nike-display font-bold text-nike-ink dark:text-white uppercase tracking-wider text-2xl md:text-3xl leading-none group-hover:opacity-80 transition-opacity'>
            {APP_NAME}
          </span>
        </Link>

        {/* Global Search */}
        <div className='hidden md:block flex-1 max-w-lg mx-auto'>
          <Search />
        </div>

        {/* Right: menu/user actions */}
        <Menu />
      </div>

      {/* Mobile Search */}
      <div className='md:hidden px-4 pb-3'>
        <Search />
      </div>
    </header>
  );
};

export default Header;
