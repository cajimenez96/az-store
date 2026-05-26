import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import MenuDark from './menu-dark';
import { getAllCategories } from '@/lib/actions/category.actions';

const HeaderStorefront = async () => {
  const categoriesResult = await getAllCategories();
  const categories = (categoriesResult.data || []).slice(0, 5);

  return (
    <header className='sticky top-0 z-50 bg-az-canvas border-b border-az-hairline-soft'>
      <div className='az-wrapper flex items-center justify-between h-16'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-3 shrink-0'>
          <Image
            src='/images/logo.svg'
            alt={`${APP_NAME} logo`}
            height={36}
            width={36}
            priority
          />
          <span className='hidden lg:block az-body-md-bold text-az-ink-deep tracking-tight'>
            {APP_NAME}
          </span>
        </Link>

        {/* Category pill tabs — desktop only */}
        {categories.length > 0 && (
          <nav className='hidden md:flex items-center gap-2'>
            {categories.map((cat: { slug: string; name: string }) => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}`}
                className='az-body-sm-bold px-4 py-2 rounded-az-full border border-az-hairline text-az-ink hover:bg-az-ink-deep hover:text-az-canvas hover:border-az-ink-deep transition-colors duration-150'
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: menu/user actions */}
        <MenuDark />
      </div>
    </header>
  );
};

export default HeaderStorefront;
