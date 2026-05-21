import { APP_NAME } from '@/lib/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-hairline-light dark:border-hairline-dark bg-canvas-cream dark:bg-canvas-night-elevated'>
      <div className='p-5 flex-center text-sm text-shade-50 dark:text-shade-40'>
        &copy; {currentYear} {APP_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
