'use client';
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <Image
        src='/images/logo-nombre.png'
        alt={`${APP_NAME} logo`}
        width={4000}
        height={1303}
        className='h-auto max-w-[310px] dark:invert'
        priority
      />
      <div className='p-6 w-1/3 rounded-lg shadow-md text-center'>
        <h1 className='text-3xl font-bold mb-4'>Página No Encontrada</h1>
        <p className='text-destructive'>
          No se pudo encontrar la página solicitada.
        </p>
        <Button variant='outline' className='mt-4 ml-2' asChild>
          <Link href='/'>Volver al Inicio</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
