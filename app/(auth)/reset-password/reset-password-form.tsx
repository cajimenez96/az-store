'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { resetPassword, verifyResetToken } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const inputClass =
  'bg-az-canvas border-az-hairline rounded-az-lg text-az-ink focus-visible:ring-az-primary focus-visible:ring-offset-0';
const labelClass = 'az-body-sm-bold text-az-ink-deep';

export default function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      const valid = await verifyResetToken(token);
      setIsValid(valid);
      setIsLoading(false);

      if (!valid) {
        toast({
          description:
            'El link de reset es inválido o ha expirado. Solicita uno nuevo.',
          variant: 'destructive',
        });
      }
    };

    verifyToken();
  }, [token, toast]);

  const validatePassword = () => {
    setPasswordError('');

    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    const result = await resetPassword({
      token: token!,
      newPassword: password,
    });

    if (result.success) {
      toast({
        description: result.message,
        variant: 'default',
      });

      // Redirect to sign-in after 2 seconds
      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className='text-center py-8'>
        <p className='az-body-sm text-az-stone'>Verificando link...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className='space-y-4 p-6 bg-red-50 border border-red-200 rounded-az-lg'>
        <h3 className='az-body-lg-bold text-red-900'>Link inválido</h3>
        <p className='az-body-sm text-red-800'>
          El link de reset es inválido, ha expirado o ya fue utilizado.
        </p>
        <Button
          onClick={() => router.push('/forgot-password')}
          variant='outlineLight'
          className='w-full'
        >
          Solicitar nuevo link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-1.5'>
        <Label className={labelClass}>Nueva contraseña</Label>
        <Input
          type='password'
          placeholder='••••••••'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-1.5'>
        <Label className={labelClass}>Confirmar contraseña</Label>
        <Input
          type='password'
          placeholder='••••••••'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
          disabled={isSubmitting}
        />
      </div>

      {passwordError && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-az-lg'>
          <p className='az-body-sm text-red-900'>{passwordError}</p>
        </div>
      )}

      <Button
        type='submit'
        variant='buyCta'
        className='w-full'
        disabled={isSubmitting || !password || !confirmPassword}
      >
        {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
      </Button>
    </form>
  );
}
