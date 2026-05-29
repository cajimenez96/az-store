'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';
import { Loader, Check } from 'lucide-react';
import { NAME_ALLOWED, passwordRequirements } from '@/utils/utils';

const sanitizeName = (value: string) =>
  value
    .split('')
    .filter((ch) => NAME_ALLOWED.test(ch))
    .join('');

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Controlled state — values survive server-action errors
  const [name, setName] = useState(signUpDefaultValues.name);
  const [email, setEmail] = useState(signUpDefaultValues.email);
  const [password, setPassword] = useState(signUpDefaultValues.password);
  const [confirmPassword, setConfirmPassword] = useState(
    signUpDefaultValues.confirmPassword
  );

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='buyCta'>
        {pending ? (
          <>
            <Loader className='animate-spin h-4 w-4' />
          </>
        ) : (
          'Registrarse'
        )}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        {/* Name */}
        <div>
          <Label
            htmlFor='name'
            className='az-body-sm-bold text-az-ink-deep mb-1.5 block'
          >
            Nombre completo
          </Label>
          <Input
            id='name'
            name='name'
            type='text'
            autoComplete='name'
            value={name}
            onChange={(e) => setName(sanitizeName(e.target.value))}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0 capitalize'
          />
        </div>

        {/* Email */}
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
            type='text'
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>

        {/* Password */}
        <div>
          <Label
            htmlFor='password'
            className='az-body-sm-bold text-az-ink-deep mb-1.5 block'
          >
            Contraseña
          </Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='new-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>

        {/* Confirm password */}
        <div>
          <Label
            htmlFor='confirmPassword'
            className='az-body-sm-bold text-az-ink-deep mb-1.5 block'
          >
            Confirmar contraseña
          </Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='new-password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className='bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0'
          />
        </div>

        {/* Password requirements checklist — shown once the user starts typing */}
        <ul
          className='space-y-1.5 text-sm'
          aria-label='Requisitos de contraseña'
        >
          {passwordRequirements.map((req) => {
            const met = req.test(password, confirmPassword);
            return (
              <li
                key={req.id}
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  met ? 'text-green-600' : 'text-az-stone'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200 ${
                    met
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-az-hairline bg-transparent'
                  }`}
                >
                  {met && <Check className='h-2.5 w-2.5' strokeWidth={3} />}
                </span>
                {req.label}
              </li>
            );
          })}
        </ul>

        {/* Submit */}
        <div>
          <SignUpButton />
        </div>

        {/* Server error */}
        {data && !data.success && (
          <div className='text-center text-destructive font-medium text-sm'>
            {data.message}
          </div>
        )}

        <div className='az-body-sm text-center text-az-stone'>
          ¿Ya tenés una cuenta?{' '}
          <Link
            href='/sign-in'
            target='_self'
            className='text-az-ink-deep underline hover:text-az-charcoal transition-colors font-medium'
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
