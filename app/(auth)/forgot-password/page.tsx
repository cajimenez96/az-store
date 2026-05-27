import { Metadata } from 'next';
import ForgotPasswordForm from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  description: 'Solicita un link para restablecer tu contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-az-canvas px-4'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='az-heading-sm text-az-ink-deep'>Recuperar contraseña</h1>
          <p className='az-body-sm text-az-stone'>
            Ingresa tu email y te enviaremos un link para restablecer tu
            contraseña.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className='text-center az-body-sm'>
          <a href='/sign-in' className='text-az-primary hover:text-az-primary-hover'>
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}
