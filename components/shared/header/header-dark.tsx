import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import MenuDark from './menu-dark';

const HeaderDark = () => {
  return (
    <header className='w-full bg-canvas-night/80 backdrop-blur-md text-white absolute top-0 left-0 right-0 z-50 border-b border-white/5'>
      <div className='wrapper flex-between py-4'>
        {/* Logo */}
        <Link href='/' className='flex-start gap-3'>
          <Image
            src='/images/logo.svg'
            alt={`${APP_NAME} logo`}
            height={40}
            width={40}
            priority={true}
            className='brightness-0 invert'
          />
          <span className='hidden lg:block font-semibold text-lg text-white tracking-wide'>
            {APP_NAME}
          </span>
        </Link>

        {/* Right nav */}
        <MenuDark />
      </div>
    </header>
  );
};

export default HeaderDark;
