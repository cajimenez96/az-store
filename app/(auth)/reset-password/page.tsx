import { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  description: 'Crea una nueva contraseña para tu cuenta',
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-az-canvas px-4'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='az-heading-sm text-az-ink-deep'>
            Restablecer contraseña
          </h1>
          <p className='az-body-sm text-az-stone'>
            Ingresa tu nueva contraseña
          </p>
        </div>

        <Suspense
          fallback={
            <div className='text-center py-8'>
              <p className='az-body-sm text-az-stone'>Verificando link...</p>
            </div>
          }
        >
          <ResetPasswordForm token={token} />
        </Suspense>

        <p className='text-center az-body-sm'>
          <a href='/sign-in' className='text-az-primary hover:text-az-primary-hover'>
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}
