'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='buyCta'>
        {pending ? 'Registrando...' : 'Registrarse'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='name' className='az-body-sm-bold text-az-ink-deep mb-1.5 block'>Nombre</Label>
          <Input
            id='name'
            name='name'
            type='text'
            autoComplete='name'
            defaultValue={signUpDefaultValues.name}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <Label htmlFor='email' className='az-body-sm-bold text-az-ink-deep mb-1.5 block'>Correo electrónico</Label>
          <Input
            id='email'
            name='email'
            type='text'
            autoComplete='email'
            defaultValue={signUpDefaultValues.email}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <Label htmlFor='password' className='az-body-sm-bold text-az-ink-deep mb-1.5 block'>Contraseña</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
            defaultValue={signUpDefaultValues.password}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword' className='az-body-sm-bold text-az-ink-deep mb-1.5 block'>Confirmar contraseña</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='confirmPassword'
            defaultValue={signUpDefaultValues.confirmPassword}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {data && !data.success && (
          <div className='text-center text-destructive font-medium text-sm'>{data.message}</div>
        )}

        <div className='az-body-sm text-center text-az-stone'>
          ¿Ya tenés una cuenta?{' '}
          <Link href='/sign-in' target='_self' className='text-az-ink-deep underline hover:text-az-charcoal transition-colors font-medium'>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
