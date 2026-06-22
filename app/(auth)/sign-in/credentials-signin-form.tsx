'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithCredentials } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

const CredentialsSignInForm = () => {
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignInButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='buyCta'>
        {pending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label
            htmlFor='email'
            className='az-body-sm-bold text-az-ink-deep mb-1.5 block'
          >
            Correo electrónico
          </Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            placeholder='tu@email.com'
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <div className='flex items-center justify-between mb-1.5'>
            <Label
              htmlFor='password'
              className='az-body-sm-bold text-az-ink-deep'
            >
              Contraseña
            </Label>
            <Link
              href='/forgot-password'
              className='az-body-sm text-az-primary hover:text-az-primary-hover'
            >
              ¿Olvidaste?
            </Link>
          </div>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='current-password'
            placeholder='************'
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <SignInButton />
        </div>

        {data && !data.success && (
          <div className='text-center text-destructive font-medium text-sm'>
            {data.message}
          </div>
        )}

        <div className='az-body-sm text-center text-az-stone'>
          ¿No tenés una cuenta?{' '}
          <Link
            href='/sign-up'
            target='_self'
            className='text-az-ink-deep underline hover:text-az-charcoal transition-colors font-medium'
          >
            Registrate
          </Link>
        </div>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
