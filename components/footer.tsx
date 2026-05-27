import { APP_NAME } from '@/lib/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-az-hairline-soft bg-az-canvas'>
      <div className='p-5 flex-center az-body-sm text-az-stone'>
        &copy; {currentYear} {APP_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
