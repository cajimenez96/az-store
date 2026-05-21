'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInDefaultValues } from '@/lib/constants';
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
      <Button disabled={pending} className='w-full' variant='primaryPill'>
        {pending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='email' className='text-sm font-medium text-black mb-1.5 block'>Correo electrónico</Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            autoComplete='email'
            defaultValue={signInDefaultValues.email}
            className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <Label htmlFor='password' className='text-sm font-medium text-black mb-1.5 block'>Contraseña</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
            defaultValue={signInDefaultValues.password}
            className='bg-white border-hairline-light rounded-md text-black focus-visible:ring-black focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <SignInButton />
        </div>

        {data && !data.success && (
          <div className='text-center text-destructive font-medium text-sm'>{data.message}</div>
        )}

        <div className='text-sm text-center text-zinc-500'>
          ¿No tenés una cuenta?{' '}
          <Link href='/sign-up' target='_self' className='text-black underline hover:text-zinc-700 transition-colors font-medium'>
            Registrate
          </Link>
        </div>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
