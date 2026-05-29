import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { auth } from '@/auth';

const FooterDark = async () => {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-[#0a1317] border-t border-white/10'>
      <div className='wrapper'>
        {/* Main footer grid */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-10 py-16'>
          {/* Brand column */}
          <div className='col-span-1 md:col-span-2'>
            <p className='text-white font-semibold text-lg mb-3'>{APP_NAME}</p>
            <p className='az-body-sm text-white/60 leading-relaxed max-w-xs'>
              Tu tienda online de confianza. Calidad, variedad y la mejor
              atención al cliente.
            </p>
          </div>

          {/* Tienda column */}
          <div>
            <p className='az-caption font-semibold uppercase tracking-widest text-white/45 mb-4'>
              Tienda
            </p>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/search'
                  className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                >
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link
                  href='/search?isFeatured=true'
                  className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                >
                  Destacados
                </Link>
              </li>
              <li>
                <Link
                  href='/cart'
                  className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                >
                  Mi carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuenta column */}
          <div>
            <p className='az-caption font-semibold uppercase tracking-widest text-white/45 mb-4'>
              Mi Cuenta
            </p>
            <ul className='space-y-3'>
              {isLoggedIn ? (
                <>
                  <li>
                    <Link
                      href='/user/profile'
                      className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                    >
                      Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/user/orders'
                      className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                    >
                      Mis pedidos
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href='/sign-in'
                    className='az-body-sm text-white/70 hover:text-white transition-colors duration-200'
                  >
                    Iniciar sesión
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Legal row */}
        <div className='border-t border-white/10 py-6 flex flex-col sm:flex-row justify-between items-center gap-3'>
          <p className='az-caption text-white/45'>
            &copy; {currentYear} {APP_NAME}. Todos los derechos reservados.
          </p>
          {/* <div className='flex gap-5'>
            <Link href='#' className='az-caption text-white/45 hover:text-white transition-colors'>
              Privacidad
            </Link>
            <Link href='#' className='az-caption text-white/45 hover:text-white transition-colors'>
              Términos
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default FooterDark;
